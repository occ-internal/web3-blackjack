const contractAddress = "0x076029176C3DD788a2080BB47EFf31C55E03AFBf";
const contractABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_address",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "deposit",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "payout",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "placeBet",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "withdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]

let contract;
let signer;
const provider = new ethers.providers.Web3Provider(window.ethereum, 80001);
provider.send("eth_requestAccounts", []).then(() => {
    provider.listAccounts().then((accounts) => {
        signer = provider.getSigner(accounts[0]);
        contract = new ethers.Contract(
            contractAddress,
            contractABI,
            signer
        );
    });
});

// an object to hold all of the variables for the blackjack app
// to avoid global variable drama
var bdApp = {};

// Store important elements in variables for later manipulation
bdApp.pcards = document.getElementById('pcards');
bdApp.dcards = document.getElementById('dcards');
bdApp.hitButton = document.getElementById('hit');
bdApp.standButton = document.getElementById('stand');
bdApp.playButton = document.getElementById('play');
bdApp.textUpdates = document.getElementById('textUpdates');
bdApp.buttonBox = document.getElementById('buttonBox');
bdApp.phandtext = document.getElementById('phand');
bdApp.dhandtext = document.getElementById('dhand');
bdApp.tracker = document.getElementById('tracker');
bdApp.newgame = document.getElementById('newgame');
bdApp.choice = document.getElementById('choice');

// initialize variables to track hands/cards/etc.
bdApp.playerHand = [];
bdApp.dealerHand = [];
bdApp.deck = [];
bdApp.suits = ['clubs <span class="bold">&#9827</span>', 'diamonds <span class="redcard">&#9830</span>', 'hearts <span class="redcard">&#9829</span>', 'spades <span class="bold">&#9824</span>'];
bdApp.values = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Jack", "Queen", "King"];
bdApp.gameStatus = 0; // flag that game has not yet been won
bdApp.wins = 0; // flag that game has not yet been won
bdApp.draws = 0; // flag that game has not yet been won
bdApp.losses = 0; // flag that game has not yet been won
bdApp.games = 0; // flag that game has not yet been won

// Object Constructor for a card. !!! ALWAYS USE NEW WHEN MAKING A NEW CARD!!!
function card(suit, value, name) {
    this.suit = suit; // string of c/d/h/s
    this.value = value; // number 1 - 10
    this.name = name; // string of the full card name
};


var newGame = async function () {
    const msgValue = 100000000000000; //0.0001
    let placeBet = contract.placeBet({ value: msgValue });
    await placeBet;
    // remove newgame button and show hit/stand buttons
    bdApp.newgame.classList.add("hidden");
    
    // reset text and variables for newgame
    bdApp.dcards.innerHTML = "";
    bdApp.dcards.innerHTML = "";
    bdApp.playerHand = [];
    bdApp.dealerHand = [];
    bdApp.gameStatus = 0;

    // Create the new deck
    bdApp.deck = createDeck();

    // Deal two cards to the player and two cards to the dealer
    bdApp.playerHand.push(bdApp.deck.pop());
    bdApp.playerHand.push(bdApp.deck.pop());

    // check for player victory
    if (handTotal(bdApp.playerHand) === 21)
    {
        bdApp.wins += 1;
        bdApp.games += 1;        
        bdApp.gameStatus = 1; // to cause the dealer's hand to be drawn face up
        drawHands();
        bdApp.textUpdates.innerHTML = "You won! You got 21 on your initial hand!";
        track();
        bdApp.gameStatus = 2; // game is won
        return;
    }

    bdApp.dealerHand.push(bdApp.deck.pop());
    bdApp.dealerHand.push(bdApp.deck.pop());

    // check for dealer victory    
    if (handTotal(bdApp.dealerHand) === 21)
    {
        bdApp.games += 1;
        bdApp.losses += 1;
        bdApp.gameStatus = 1; // to cause the dealer's hand to be drawn face up
        drawHands();
        bdApp.textUpdates.innerHTML = "You lost! The dealer had 21 on their initial hand.";
        track();
        bdApp.gameStatus = 2; // game is won
        return;
    }

    // draw the hands if neither won on the initial deal
    drawHands();
    advise();
    bdApp.buttonBox.classList.remove("hidden"); // show hit/stand buttons
    bdApp.textUpdates.innerHTML = "The initial hands are dealt!";
    
};

var createDeck = function () {
    var deck = [];
    // loop through suits and values, building cards and adding them to the deck as you go
    for (var a = 0; a < bdApp.suits.length; a++) {
        for (var b = 0; b < bdApp.values.length; b++) {
            var cardValue = b + 1;
            var cardTitle = "";            
            if (cardValue > 10){
                cardValue = 10;
            }
            if (cardValue != 1) {
                cardTitle += (bdApp.values[b] + " of " + bdApp.suits[a] + " (" + cardValue + ")");
            }
            else
            {
                cardTitle += (bdApp.values[b] + " of " + bdApp.suits[a] + " (" + cardValue + " or 11)");
            }
            var newCard = new card(bdApp.suits[a], cardValue, cardTitle);
            deck.push(newCard);
            

        }
    }
    //console.log("Deck created! Deck size: " + deck.length)
    deck = shuffle(deck);
    //console.log("Deck shuffeled! Deck size: " + deck.length)
    //deckPrinter(deck);
    return deck;
};

// Update the screen with the contents of the player and dealer hands
var drawHands = function () {    
    var htmlswap = "";
    var ptotal = handTotal(bdApp.playerHand);
    var dtotal = handTotal(bdApp.dealerHand);
    htmlswap += "<ul>";
    for (var i = 0; i < bdApp.playerHand.length; i++)
    {
        htmlswap += "<li>" + bdApp.playerHand[i].name + "</li>";
    }
    htmlswap += "</ul>"
    bdApp.pcards.innerHTML = htmlswap;
    bdApp.phandtext.innerHTML = "Your Hand (" + ptotal + ")"; // update player hand total
    if (bdApp.dealerHand.length == 0)
    {
        return;
    }

    // clear the html string, re-do for the dealer, depending on if stand has been pressed or not
    htmlswap = "";
    if (bdApp.gameStatus === 0)
    {
        htmlswap += "<ul><li>[Hidden Card]</li>";
        bdApp.dhandtext.innerHTML = "Dealer's Hand (" + bdApp.dealerHand[1].value + " + hidden card)"; // hide value while a card is face down
    }
    else
    {
        bdApp.dhandtext.innerHTML = "Dealer's Hand (" + dtotal + ")"; // update dealer hand total
    }
    
    for (var i = 0; i < bdApp.dealerHand.length; i++) {
        // if the dealer hasn't had any new cards, don't display their face-down card
        // skip their first card, which will be displayed as hidden card
        // per the above if statement
        if (bdApp.gameStatus === 0)
        {
            i += 1;
        }
        htmlswap += "<li>" + bdApp.dealerHand[i].name + "</li>";
    }
    htmlswap += "</ul>"
    bdApp.dcards.innerHTML = htmlswap;
    //console.log("Player has " + bdApp.playerHand.length + " cards, dealer has " + bdApp.dealerHand.length + " cards, and deck has " + bdApp.deck.length + " cards.");

};

// return the total value of the hand 
var handTotal = function (hand) {
    //console.log("Checking hand value");
    var total = 0;
    var aceFlag = 0; // track the number of aces in the hand
    for (var i = 0; i < hand.length; i++) {
        //console.log("Card: " + hand[i].name);
        total += hand[i].value;
        if (hand[i].value == 1)
        {
            aceFlag += 1;
        }
    }
    // For each ace in the hand, add 10 if doing so won't cause a bust
    // To show best-possible hand value
    for (var j = 0; j < aceFlag; j++)
    {
        if (total + 10 <= 21)
        {
            total +=10;
        }
    }
    // console.log("Total: " + total);
    return total;
}

// Shuffle the new deck
var shuffle = function (deck) {
    // console.log("Begin shuffle...");
    var shuffledDeck = [];
    var deckL = deck.length;
    for (var a = 0; a < deckL; a++)
    {
        var randomCard = getRandomInt(0, (deck.length));        
        shuffledDeck.push(deck[randomCard]);
        deck.splice(randomCard, 1);        
    }
    return shuffledDeck;
}

var getRandomInt = function (min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    // console.log("Min: " + min + " Max: " + max);
    return Math.floor(Math.random() * (max - min)) + min;
    // code based on sample from MDN
}

// print the deck to the console 
// only for for debugging purposes
var deckPrinter = function (deck) {
    for (var i = 0; i < deck.length; i++)
    {
        console.log(deck[i].name);
    }
    return
}

// Game loop begins when the play button is pressed
bdApp.playButton.addEventListener("click", newGame);

// Hit button pressed:
bdApp.hitButton.addEventListener("click", function () {
    // disable if the game has already been won
    if (bdApp.gameStatus === 2)
    {
        console.log("Hit clicked when game was over or already clicked.");
        return;
    }

    // deal a card to the player and draw the hands
    bdApp.playerHand.push(bdApp.deck.pop());
    drawHands();
   

    var handVal = handTotal(bdApp.playerHand);
    if (handVal > 21)
    {
        bust();
        advise();
        return;
    }
    else if (handVal === 21)
    {
        victory();
        advise();
        return;
    }
    advise();
    bdApp.textUpdates.innerHTML = "Hit or stand?</p>";
    return;      
});

// Stand button pressed:
bdApp.standButton.addEventListener("click", function standLoop() {
    //console.log("(1)Inside standLoop now");
    // disable ig game already won
    if (bdApp.gameStatus === 2)
    {
        console.log("Stand clicked when game was over or already clicked.");
        return;
    }
    else if (bdApp.gameStatus === 0) // i.e. stand was just pressed
    {
        
        bdApp.buttonBox.classList.add("hidden"); // take away the hit and stand buttons
        var handVal = handTotal(bdApp.dealerHand);
        bdApp.gameStatus = 1; // enter the 'stand' loop
        advise(); // clear advise
        bdApp.textUpdates.innerHTML = "The dealer reveals their hidden card";
        drawHands();
        setTimeout(standLoop, 750); // return to the stand loop
    }
    else if (bdApp.gameStatus === 1) {    

    // If dealer has less than 17, hit
    var handVal = handTotal(bdApp.dealerHand);
    if (handVal > 16 && handVal <= 21) // dealer stands and game resolves
    {
        drawHands();
        //console.log("----------Dealer stands, checking hands");
        var playerVal = handTotal(bdApp.playerHand);
        if (playerVal > handVal)
        {            
            victory();
            return;
        }
        else if (playerVal < handVal)
        {            
            bust();
            return;
        }
        else
        {            
            tie();
            return;
        }
    }
    if (handVal > 21)
    {
        victory();
        return;
    }
    else // hit
    {
        bdApp.textUpdates.innerHTML = "Dealer hits!";
        bdApp.dealerHand.push(bdApp.deck.pop());
        drawHands();
        setTimeout(standLoop, 750);
        return;
    }   
    }
});

var victory = async function () {
    bdApp.wins += 1;
    bdApp.games += 1;
    var explanation = "";
    bdApp.gameStatus = 2; // flag that the game is over
    var playerTotal = handTotal(bdApp.playerHand);
    var dealerTotal = handTotal(bdApp.dealerHand);
    let payout = await contract.payout();
    console.log(payout);
    await payout;

    if (playerTotal === 21)
    {
        explanation = "Your hand's value is 21!";
    }
    else if (dealerTotal > 21)
    {
        explanation = "Dealer busted with " + dealerTotal + "!";
    }
    else
    {
        explanation = "You had " + playerTotal + " and the dealer had " + dealerTotal + ".";
    }
    bdApp.textUpdates.innerHTML = "You won!<br>" + explanation + "<br>Press 'New Game' to play again.";
    track();
}

var bust = function () {
    bdApp.games += 1;
    bdApp.losses += 1;
    var explanation = "";
    bdApp.gameStatus = 2; // flag that the game is over
    var playerTotal = handTotal(bdApp.playerHand);
    var dealerTotal = handTotal(bdApp.dealerHand);
    if (playerTotal > 21)
    {
        explanation = "You busted with " + playerTotal + ".";
    }
    bdApp.textUpdates.innerHTML = "You lost.<br>" + explanation + "<br>Press 'New Game' to play again.";
    track();
}

var tie = function () {    
    bdApp.games += 1;
    bdApp.draws += 1;
    var explanation = "";
    bdApp.gameStatus = 2; // flag that the game is over
    var playerTotal = handTotal(bdApp.playerHand);
    bdApp.textUpdates.innerHTML = "It's a tie at " + playerTotal + " points each.<br>Press 'New Game' to play again.";
    track();
}

// update the win/loss counter
var track = function () {
    bdApp.tracker.innerHTML = "<p>Wins: " + bdApp.wins + " Draws: " + bdApp.draws + " Losses: " + bdApp.losses + "</p>";
    bdApp.newgame.classList.remove("hidden");
    bdApp.buttonBox.classList.add("hidden");
}

// check the player hand for an ace
var softCheck = function (hand) {    
    var total = 0;
    var aceFlag = 0; // track the number of aces in the hand
    for (var i = 0; i < hand.length; i++) {
        //console.log("Card: " + hand[i].name);
        total += hand[i].value;
        if (hand[i].value == 1) {
            aceFlag += 1;
        }
    }
    // For each ace in the hand, add 10 if doing so won't cause a bust
    // To show best-possible hand value
    for (var j = 0; j < aceFlag; j++) {
        if (total + 10 <= 21) {
            return true; // the hand is soft, i.e. it can be multiple values because of aces
        }
    }    
    return false; // the hand is hard, i.e. it has only one possible value
}

var advise = function () {
    // no advise if player has no choices
    if (bdApp.gameStatus > 0)
    {
        bdApp.choice.innerHTML = "";
        return;
    } 
    var playerTotal = handTotal(bdApp.playerHand);
    var soft = softCheck(bdApp.playerHand);
    console.log("Soft: " + soft);
    var dealerUp = bdApp.dealerHand[1].value;
    // count dealer's ace as 11 to simplify logic
    if (dealerUp === 1)
    {
        dealerUp = 11;
    }

    // provide advice based on HIGHLY simplified blackjack basic strategy
    if (playerTotal <= 11 && !soft)
    {
        bdApp.choice.innerHTML = "[Hit!]";
    }
    else if (playerTotal >= 12 && playerTotal <= 16 && dealerUp <= 6 && !soft)
    {
        bdApp.choice.innerHTML = "[Stand]";
    }
    else if (playerTotal >= 12 && playerTotal <= 16 && dealerUp >= 7 && !soft)
    {
        bdApp.choice.innerHTML = "[Hit!]";
    }
    else if (playerTotal >= 17 && playerTotal <= 21 && !soft)
    {
        bdApp.choice.innerHTML = "[Stand]";
    }
    else if (playerTotal >= 12 && playerTotal <= 18 && soft)
    {
        bdApp.choice.innerHTML = "[Hit!]";
    }
    else if (playerTotal >= 19 && playerTotal <= 21 && soft)
    {
        bdApp.choice.innerHTML = "[Stand]";
    }
    else
    {
        bdApp.choice.innerHTML = "Massive error, unexpected scenario, idk";
        console.log("Error: Player's hand was " + playerTotal + " and dealer's faceup was " + dealerUp + ".");
    }
    return;
}