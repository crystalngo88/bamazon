var mysql = require("mysql");
var inquirer = require("inquirer");

var connection = mysql.createConnection({
    host: "localhost",

    port: 3306,

    user: "root",

    password: "",
    database: "bamazon_db"
});

connection.connect(function (err) {
    if (err) throw err;
    start();
});

// function which prompts the user for what action they should take
function start() {
    inquirer
        .prompt({
            name: "sellOrBuy",
            type: "rawlist",
            message: "Would you like to [SELL] something or [BUY] something?",
            choices: ["SELL", "BUY"]
        })
        .then(function (answer) {
            // based on their answer, either call the buy or the sell functions
            if (answer.sellOrBuy.toUpperCase() === "SELL") {
                sellSomething();
            }
            else {
                buySomething();
            }
        });
}

// function to handle posting new items up for auction
function sellSomething() {
    // prompt for info about the item being put up for auction
    inquirer
        .prompt([
            {
                name: "product_name",
                type: "input",
                message: "What is the item you would like to sell?"
            },
            {
                name: "category",
                type: "input",
                message: "What category would you like to place your item in?"
            },
            {
                name: "price",
                type: "input",
                message: "How much does it cost?",
                validate: function (value) {
                    if (isNaN(value) === false) {
                    return true;
                    }
                    return false;
                }
            },
            {
                name: "stock_quantity",
                type: "input",
                message: "How many do you have to sell?",
                validate: function (value) {
                    if (isNaN(value) === false) {
                        return true;
                    }
                    return false;
                }
            },
        ])
        .then(function (answer) {
            // when finished prompting, insert a new item into the db with that info
            connection.query(
                "INSERT INTO storefront SET ?",
                {
                    product_name: answer.product_name,
                    category: answer.category,
                    price: answer.price,
                    stock_quantity: answer.stock_quantity
                },
                function (err) {
                    if (err) throw err;
                    console.log("--------------------------------------")
                    console.log("Your product was added to the storefront successfully!");
                    console.log("--------------------------------------")
                    start();
                }
            );
        });
};

function buySomething() {
    // query the database for all items being auctioned
    connection.query("SELECT * FROM storefront", function (err, results) {
        if (err) throw err;
        // once you have the items, prompt the user for which they'd like to bid on
        inquirer
            .prompt([
                {
                    name: "choice",
                    type: "rawlist",
                    choices: function () {
                        var choiceArray = [];
                        for (var i = 0; i < results.length; i++) {
                            choiceArray.push(results[i].product_name);
                        }
                        return choiceArray;
                    },
                    message: "What is the ID for the product would you like to purchase?"
                },
                {
                    name: "stock_quantity",
                    type: "input",
                    message: "How many would you like to purchase?"
                }
            ])
            .then(function (answer) {
                // get the information of the chosen item
                var chosenItem;
                for (var i = 0; i < results.length; i++) {
                    if (results[i].product_name === answer.choice) {
                        chosenItem = results[i];
                    }
                }

                // determine if bid was high enough
                if (chosenItem.stock_quantity > parseInt(answer.stock_quantity)) {
                    // bid was high enough, so update db, let the user know, and start over
                    connection.query(
                        "UPDATE storefront SET ? WHERE ?",
                        [
                            {
                                stock_quantity: //stock quantity-answer.stock_quantity
                            },
                            {
                                id: chosenItem.id
                            }
                        ],
                        function (error) {
                            if (error) throw err;
                            console.log("Your order has been placed!");
                            start();
                        }
                    );
                }
                else {
                    // bid wasn't high enough, so apologize and start over
                    console.log("We don't have enough! Please try again");
                    start();
                }
            });
    });
}
