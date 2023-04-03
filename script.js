// an object to hold all of the variables for the blackjack app
// to avoid global variable drama
var bjsApp = {};

// Store important elements in variables for later manipulation
bjsApp.pcards = document.getElementById('pcards');
bjsApp.dcards = document.getElementById('dcards');
bjsApp.hitButton = document.getElementById('hit');
bjsApp.standButton = document.getElementById('stand');
bjsApp.playButton = document.getElementById('play');
bjsApp.textUpdates = document.getElementById('textUpdates');
bjsApp.buttonBox = document.getElementById('buttonBox');
bjsApp.phandtext = document.getElementById('phand');
bjsApp.dhandtext = document.getElementById('dhand');
bjsApp.tracker = document.getElementById('tracker');
bjsApp.newgame = document.getElementById('newgame');
bjsApp.choice = document.getElementById('choice');

// initialize variables to track hands/cards/etc.
bjsApp.playerHand = [];
bjsApp.dealerHand = [];
bjsApp.deck = [];
bjsApp.suits = ['clubs <span class="bold">&#9827</span>', 'diamonds <span class="redcard">&#9830</span>', 'hearts <span class="redcard">&#9829</span>', 'spades <span class="bold">&#9824</span>'];
bjsApp.values = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Jack", "Queen", "King"];
    // flag that game has not yet been won
bjsApp.gameStatus = 0; 
bjsApp.wins = 0;
bjsApp.draws = 0;
bjsApp.losses = 0;
bjsApp.games = 0;

// Blockchain information
const contractAddress = "0xD7B0Ab65902Dc1d2104829bCB26fff12E58D9D3E";
const contractAbi = [
    [
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "payoutAmount",
                    "type": "uint256"
                }
            ],
            "name": "payout",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "betAmount",
                    "type": "uint256"
                }
            ],
            "name": "placeBet",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "tie",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "inputs": [],
            "name": "withdraw",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ]
];

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
let betAmount;

const gameContract = new ethers.Contract(contractAddress, contractAbi, signer);

// Blockchain functions

// async function placeBet(betAmount) {
//     betAmount = betAmount;
//     try {
//         const tx = await contractAbi.placeBet(betAmount, { value: betAmount});
//         await tx.wait();
//         console.log("Bet placed successfully");
//     } catch (error) {
//         console.error("Error placing bet: ", error);
//     }
// }

async function payout() {
    if (signer == undefined) {
      alert("Connect your MetaMask");
    }
    
    // Trigger the payout function on the smart contract instance
    var payoutAmount = web3.utils.toWei("0.01", "ether"); // Set the amount to payout (in wei)
    gameContract.payout(payoutAmount).send({from: web3.eth.defaultAccount})
    .then(function(receipt) {
        console.log("Payout successful:", receipt);
    })
    .catch(function(error) {
        console.error("Payout failed:", error);
    });
  
  }

// Object Constructor for a card
function card(suit, value, name) {
    this.suit = suit; // string of c/d/h/s
    this.value = value; // number 1 - 10
    this.name = name; // string of the full card name
};


var newGame = function () {
    // remove newgame button and show hit/stand buttons
    bjsApp.newgame.classList.add("hidden");
    
    // reset text and variables for newgame
    bjsApp.dcards.innerHTML = "";
    bjsApp.dcards.innerHTML = "";
    bjsApp.playerHand = [];
    bjsApp.dealerHand = [];
    bjsApp.gameStatus = 0;

    // Create the new deck
    bjsApp.deck = createDeck();

    // Deal two cards to the player
    bjsApp.playerHand.push(bjsApp.deck.pop());
    bjsApp.playerHand.push(bjsApp.deck.pop());

    // check for player victory
    if (handTotal(bjsApp.playerHand) === 21)
    {
        bjsApp.wins += 1;
        bjsApp.games += 1;        
        bjsApp.gameStatus = 1; // to cause the dealer's hand to be drawn face up
        drawHands();
        bjsApp.textUpdates.innerHTML = "You won! You got 21 on your initial hand!";
        track();
        bjsApp.gameStatus = 2; // game is won
        return;
    }

    // Deal two cards to the dealer
    bjsApp.dealerHand.push(bjsApp.deck.pop());
    bjsApp.dealerHand.push(bjsApp.deck.pop());

    // check for dealer victory    
    if (handTotal(bjsApp.dealerHand) === 21)
    {
        bjsApp.games += 1;
        bjsApp.losses += 1;
        bjsApp.gameStatus = 1; // to cause the dealer's hand to be drawn face up
        drawHands();
        bjsApp.textUpdates.innerHTML = "You lost! The dealer had 21 on their initial hand.";
        track();
        bjsApp.gameStatus = 2; // game is won
        return;
    }

    // draw the hands if neither won on the initial deal
    drawHands();
    advise();
    bjsApp.buttonBox.classList.remove("hidden"); // show hit/stand buttons
    bjsApp.textUpdates.innerHTML = "The initial hands are dealt!";
    
};

var createDeck = function () {
    var deck = [];
    // loop through suits and values, building cards and adding them to the deck as you go
    for (var a = 0; a < bjsApp.suits.length; a++) {
        for (var b = 0; b < bjsApp.values.length; b++) {
            var cardValue = b + 1;
            var cardTitle = "";            
            if (cardValue > 10){
                cardValue = 10;
            }
            if (cardValue != 1) {
                cardTitle += (bjsApp.values[b] + " of " + bjsApp.suits[a] + " (" + cardValue + ")");
            }
            else
            {
                cardTitle += (bjsApp.values[b] + " of " + bjsApp.suits[a] + " (" + cardValue + " or 11)");
            }
            var newCard = new card(bjsApp.suits[a], cardValue, cardTitle);
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
    var ptotal = handTotal(bjsApp.playerHand);
    var dtotal = handTotal(bjsApp.dealerHand);
    htmlswap += "<ul>";
    for (var i = 0; i < bjsApp.playerHand.length; i++)
    {
        htmlswap += "<li>" + bjsApp.playerHand[i].name + "</li>";
    }
    htmlswap += "</ul>"
    bjsApp.pcards.innerHTML = htmlswap;
    bjsApp.phandtext.innerHTML = "Your Hand (" + ptotal + ")"; // update player hand total
    if (bjsApp.dealerHand.length == 0)
    {
        return;
    }

    // clear the html string, re-do for the dealer, depending on if stand has been pressed or not
    htmlswap = "";
    if (bjsApp.gameStatus === 0)
    {
        htmlswap += "<ul><li>[Hidden Card]</li>";
        bjsApp.dhandtext.innerHTML = "Dealer's Hand (" + bjsApp.dealerHand[1].value + " + hidden card)"; // hide value while a card is face down
    }
    else
    {
        bjsApp.dhandtext.innerHTML = "Dealer's Hand (" + dtotal + ")"; // update dealer hand total
    }
    
    for (var i = 0; i < bjsApp.dealerHand.length; i++) {
        // if the dealer hasn't had any new cards, don't display their face-down card
        // skip their first card, which will be displayed as hidden card
        // per the above if statement
        if (bjsApp.gameStatus === 0)
        {
            i += 1;
        }
        htmlswap += "<li>" + bjsApp.dealerHand[i].name + "</li>";
    }
    htmlswap += "</ul>"
    bjsApp.dcards.innerHTML = htmlswap;
    //console.log("Player has " + bjsApp.playerHand.length + " cards, dealer has " + bjsApp.dealerHand.length + " cards, and deck has " + bjsApp.deck.length + " cards.");

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
bjsApp.playButton.addEventListener("click", newGame);

// Hit button pressed:
bjsApp.hitButton.addEventListener("click", function () {
    // disable if the game has already been won
    if (bjsApp.gameStatus === 2)
    {
        console.log("Hit clicked when game was over or already clicked.");
        return;
    }

    // deal a card to the player and draw the hands
    bjsApp.playerHand.push(bjsApp.deck.pop());
    drawHands();
   

    var handVal = handTotal(bjsApp.playerHand);
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
    bjsApp.textUpdates.innerHTML = "Hit or stand?</p>";
    return;      
});

// Stand button pressed:
bjsApp.standButton.addEventListener("click", function standLoop() {
    //console.log("(1)Inside standLoop now");
    // disable ig game already won
    if (bjsApp.gameStatus === 2)
    {
        console.log("Stand clicked when game was over or already clicked.");
        return;
    }
    else if (bjsApp.gameStatus === 0) // i.e. stand was just pressed
    {
        
        bjsApp.buttonBox.classList.add("hidden"); // take away the hit and stand buttons
        var handVal = handTotal(bjsApp.dealerHand);
        bjsApp.gameStatus = 1; // enter the 'stand' loop
        advise(); // clear advise
        bjsApp.textUpdates.innerHTML = "The dealer reveals their hidden card";
        drawHands();
        setTimeout(standLoop, 750); // return to the stand loop
    }
    else if (bjsApp.gameStatus === 1) {    

    // If dealer has less than 17, hit
    var handVal = handTotal(bjsApp.dealerHand);
    if (handVal > 16 && handVal <= 21) // dealer stands and game resolves
    {
        drawHands();
        //console.log("----------Dealer stands, checking hands");
        var playerVal = handTotal(bjsApp.playerHand);
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
        bjsApp.textUpdates.innerHTML = "Dealer hits!";
        bjsApp.dealerHand.push(bjsApp.deck.pop());
        drawHands();
        setTimeout(standLoop, 750);
        return;
    }   
    }
});

var victory = function () {
    bjsApp.wins += 1;
    bjsApp.games += 1;
    var explanation = "";
    bjsApp.gameStatus = 2; // flag that the game is over
    var playerTotal = handTotal(bjsApp.playerHand);
    var dealerTotal = handTotal(bjsApp.dealerHand);
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
    bjsApp.textUpdates.innerHTML = "You won!<br>" + explanation + "<br>Press 'New Game' to play again.";
    track();
    payout();

}

var bust = function () {
    bjsApp.games += 1;
    bjsApp.losses += 1;
    var explanation = "";
    bjsApp.gameStatus = 2; // flag that the game is over
    var playerTotal = handTotal(bjsApp.playerHand);
    var dealerTotal = handTotal(bjsApp.dealerHand);
    if (playerTotal > 21)
    {
        explanation = "You busted with " + playerTotal + ".";
    }
    bjsApp.textUpdates.innerHTML = "You lost.<br>" + explanation + "<br>Press 'New Game' to play again.";
    track();
}

var tie = function () {    
    bjsApp.games += 1;
    bjsApp.draws += 1;
    var explanation = "";
    bjsApp.gameStatus = 2; // flag that the game is over
    var playerTotal = handTotal(bjsApp.playerHand);
    bjsApp.textUpdates.innerHTML = "It's a tie at " + playerTotal + " points each.<br>Press 'New Game' to play again.";
    track();
}

// update the win/loss counter
var track = function () {
    bjsApp.tracker.innerHTML = "<p>Wins: " + bjsApp.wins + " Draws: " + bjsApp.draws + " Losses: " + bjsApp.losses + "</p>";
    bjsApp.newgame.classList.remove("hidden");
    bjsApp.buttonBox.classList.add("hidden");
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
    if (bjsApp.gameStatus > 0)
    {
        bjsApp.choice.innerHTML = "";
        return;
    } 
    var playerTotal = handTotal(bjsApp.playerHand);
    var soft = softCheck(bjsApp.playerHand);
    console.log("Soft: " + soft);
    var dealerUp = bjsApp.dealerHand[1].value;
    // count dealer's ace as 11 to simplify logic
    if (dealerUp === 1)
    {
        dealerUp = 11;
    }

    // provide advice based on HIGHLY simplified blackjack basic strategy
    if (playerTotal <= 11 && !soft)
    {
        bjsApp.choice.innerHTML = "[Hit!]";
    }
    else if (playerTotal >= 12 && playerTotal <= 16 && dealerUp <= 6 && !soft)
    {
        bjsApp.choice.innerHTML = "[Stand]";
    }
    else if (playerTotal >= 12 && playerTotal <= 16 && dealerUp >= 7 && !soft)
    {
        bjsApp.choice.innerHTML = "[Hit!]";
    }
    else if (playerTotal >= 17 && playerTotal <= 21 && !soft)
    {
        bjsApp.choice.innerHTML = "[Stand]";
    }
    else if (playerTotal >= 12 && playerTotal <= 18 && soft)
    {
        bjsApp.choice.innerHTML = "[Hit!]";
    }
    else if (playerTotal >= 19 && playerTotal <= 21 && soft)
    {
        bjsApp.choice.innerHTML = "[Stand]";
    }
    else
    {
        bjsApp.choice.innerHTML = "Massive error, unexpected scenario, idk";
        console.log("Error: Player's hand was " + playerTotal + " and dealer's faceup was " + dealerUp + ".");
    }
    return;
}

