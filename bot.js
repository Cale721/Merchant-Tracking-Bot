var Discord = require('discord.io');
var logger = require('winston');
var mysql = require('mysql');
var align = require('align-text');
var pad = require('pad-right');
var rightAlign = require('right-align');
var center = require('center-align');


var pool = mysql.createPool({
    connectionLimit: 20,
    host: (process.env.Database_host),
    user: (process.env.Database_user),
    password: (process.env.Database_pass),
    database: (process.env.Database_db)
});


// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';


// Initialize Discord Bot
var bot = new Discord.Client({
    token: process.env.authtoken,
    autorun: true
});



bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

let tempvar = false;
let tempvar2 = false;
bot.on('message', function (user, userID, channelID, message, evt) {

    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        //if(tempvar == false){
        switch (cmd) {
            case 'ping':
                ping(channelID);
                break;

            case 'sold':
                sell_argcheck(args, channelID);
                break;

            case 'inv':
                inv_check(channelID);
                break;

            //case 'multi':
                //sell_multi_orders();
               // break;

            case 'list':
              list_argcheck(args, channelID);
              break;

             case 'remove':
              remove_argcheck(args, channelID);
              break;

            case 'help':
            	help(channelID);
            	break;

          
            case 'makinplays':
                makinplays(channelID);
                break;

            case 'kill':
                kill_argcheck(args, channelID, user);
                break;

            case 'killstats':
                kill_stats(channelID, user);
                break;

            case 'clearinv':
                clearinv(channelID);
                break;

            case 'removerow':
                removerow(args, channelID);
                break;

            case 'updateprice':
                updateprice(args, channelID);
                break;   

            case 'total':
                getTotal(args, channelID);
                break;  

            case 'misc':
                misc(args, channelID);
                break;

            case 'bp':
                bp(args, channelID, user);
                break;

            case 'bpslearned':
                bpslearned(args, channelID);
                break;  
            }
        //}

        /*
        	if (tempvar2 == true){
        			switch (cmd){
            		case 'Y':
            		pool.getConnection(function (err, connection) {
            		remove_write_update(qty, invItem, currency, channelID, connection, currQty);
            		});
            		tempvar2 = false;
            		break;

            		case 'N':
            		message_body = `Remove for ${invItem} cancelled.`
                	send_message(channelID, message_body);
            		tempvar2 = false;
            		break;
            	}
        	}
            if (tempvar == true){
            	switch (cmd){
            		case 'Y':
            		pool.getConnection(function (err, connection) {
            		list_write_update(qty, invItem, currency, price, channelID, connection, currQty);
            		});
            		tempvar = false;
            		break;

            		case 'N':
            		message_body = `List update for ${invItem} cancelled.`
                	send_message(channelID, message_body);
            		tempvar = false;
            		break;
            	}
            }

            */

        }
});


var help = function (channelID) {
   str1 = "The following commands are available: \n";
   str1 += "!inv --- Check current inventory\n";
   str1 += "!list <quantity> <name> <currency> <price> --- List new items to inventory \n";
   str1 += "!sold <quantity> <name> <currency> --- Track item sales \n";
   str1 += "!remove <quantity> <name> <currency> --- Remove items from inventory \n";
   str1 += "!removerow <name> <currency> <price> --- Delete row from table. \n";
   str1 += "!updateprice <name> <currency> <price> --- Update price for existing row \n";
   str1 += "!total <currency> --- Sum total sold by currency \n";
   str1 += "!clearinv --- Clears all current inventory \n";
   str1 += "!misc <item> <currency> <amount> --- Track misc items gained \n";
   str1 += "!bp <itemname> --- Add new bp\n";
   str1 += "!bpslearned <playername> --- Check bps learned for player\n";


   message_body = `\`\`\`${str1}\`\`\``;
   send_message(channelID, message_body);
};


var ping = function (channelID) {
    bot.sendMessage({
        to: channelID,
        message: 'Pong!'
    });
    console.log('pong');
};


//Dumb stuff Commands

var makinplays = function (channelID) {
   message_body = "MAKIN PLAYS!!!";  
   send_message(channelID, message_body);
};


//Inventory Check
var inv_check = function (channelID) {
    var sql = "select * from inventory ORDER BY price;"
    pool.getConnection(function (err, connection) {
        connection.query(sql, function (err, result) {
            if (err) throw err;
            connection.release();

            var str1 = 'Quantity  Item Name      Currency    Price    Sold   Total  \n';
            for (var index in result) {
                str1 += pad(`   ${result[index].Quantity}`, 9, ' ');
                str1 += pad(` ${result[index].Name}`, 16, ' ');
                str1 += pad(` ${result[index].Currency}`, 13, ' ');
                str1 += pad(` ${result[index].Price} `, 8, ' ');
                str1 += pad(` ${result[index].Sold}`, 8, ' ');
                str1 += pad(` ${result[index].Total}`, 2, ' ');
                str1 += `\n`;
            }
                //str1 += `Total`;

            message_body = `\`\`\`${str1}\`\`\``;
            //console.log(message_body);
            send_message(channelID, message_body);
        });
    });
}

//Remove Row
var removerow = function (args, channelID) {
	if (args.length < 3) {
        message_body = "Format for this command is: !removerow <name> <currency>.";
        send_message(channelID, message_body);
    }
    else{
        invItem = args[1];
        currency = args[2];
    
    //var sql = `select * from inventory WHERE name = '${invItem}'`;// AND currency = '${currency}'`;

    var sql = `DELETE from inventory WHERE name = '${invItem}' AND currency = '${currency}'`;

    pool.getConnection(function (err, connection) {
        connection.query(sql, function (err, result) {
            if (err) throw err;
            connection.release();
                console.log("Number of records deleted: " + result.affectedRows);

            message_body = 'Row removed.'
/*
            var str1 = 'Quantity  Item Name      Currency    Price   Sold  \n';
            for (var index in result) {
                str1 += pad(`   ${result[index].Quantity}`, 9, ' ');
                str1 += pad(` ${result[index].Name}`, 16, ' ');
                str1 += pad(` ${result[index].Currency}`, 13, ' ');
                str1 += pad(` ${result[index].Price} `, 8, ' ');
                str1 += pad(` ${result[index].Sold}`, 2, ' ');
                str1 += `\n`;
            }
                //str1 += `Total`;

            message_body = `\`\`\`${str1}\`\`\``;
            */
            //console.log(message_body);
            send_message(channelID, message_body);
        });
    });
}
}


//Update Row
var updateprice = function (args, channelID) {
    if (args.length < 4) {
        message_body = "Format for this command is: !updateprice <name> <currency> <price>.";
        send_message(channelID, message_body);
    }
    else{
        invItem = args[1];
        currency = args[2];
        price = args[3];
    if (isNaN(args[3])) {
        message_body = "Format for this command is: !updateprice <name> <currency> <price>.  You must input a number for <price>.";
        send_message(channelID, message_body);
    }


    var sql = `UPDATE inventory SET price = '${price}' WHERE name = '${invItem}' AND currency = '${currency}'`;


    pool.getConnection(function (err, connection) {
        connection.query(sql, function (err, result) {
            if (err) throw err;
            connection.release();
               // console.log("Number of records deleted: " + result.affectedRows);

            message_body = 'Price updated.'
            send_message(channelID, message_body);
        });
    });
}
}


//Clear inventory
var clearinv = function (channelID) {

    var sql = "DELETE from inventory WHERE name <> ' ';"
    pool.getConnection(function (err, connection) {
        connection.query(sql, function (err, result) {
            if (err) throw err;
            connection.release();

            console.log(result.affectedRows);
            message_body = 'All rows have been deleted.';
            send_message(channelID, message_body);
        });
    });
}


//Total
var getTotal = function (args, channelID) {

    if (args.length < 2) {
        message_body = "Format for this command is: !total <currency>.";
        send_message(channelID, message_body);
    }
    else{
        currency = args[1];

    var sql = `Select total from inventory WHERE currency = '${currency}'`;
    pool.getConnection(function (err, connection) {
        connection.query(sql, function (err, result) {
            total = 0;
            for (var index in result) {
                total = (total + result[index].total);
            }
            //total = JSON.stringify(result[0]);
            console.log(total);
            if (err) throw err;
            connection.release();

            //console.log(result.affectedRows);
            message_body = `Total ${currency} sold = ${total} `;
            send_message(channelID, message_body);
        });
    });
}
}

//Misc
var misc = function (args, channelID) {

    if (args.length < 4) {
        message_body = "Format for this command is: !misc <item> <currency> <amount>.";
        send_message(channelID, message_body);
    }
    else{
        item = args[1];
        currency = args[2];
        amount = Number(args[3]);

    var sql = `Select item, currency, amount from misc WHERE item = '${item}'`;
    pool.getConnection(function (err, connection) {
        connection.query(sql, function (err, result) {
        if (result.length > 0){
	currQty = result[0].amount;
    newQty = currQty + amount;

    var write = `UPDATE misc SET amount = '${newQty}' WHERE item = '${item}'`;
    connection.query(write, function(err, write_result){
        //console.log(write_result.affectedRows + " record(s) updated");
        connection.release();
    	message_body = `Total ${currency} from ${item} = ${newQty} `;
    	send_message(channelID, message_body);
    	    });
			}
			else{
				message_body = `No row found`;
                send_message(channelID, message_body);
                connection.release();
			}
		});
    });
  }
}

//BP
var bp = function (args, channelID, user) {
	if (args.length < 2) {
        message_body = "Format for this command is: !bp <itemname>.";
        send_message(channelID, message_body);
    }
    else {
    	blueprint = args[1];

    var sql = `Select name, blueprint from blueprints where name = '${user}'`;
    //console.log({$user});
     pool.getConnection(function (err, connection) {
        connection.query(sql, function (err, result) {
        if (result.length > 0){
        	currBlueprints = result[0].blueprint;
        	newBlueprints = currBlueprints + ' | ' + blueprint;

    var write = `UPDATE blueprints SET blueprint = '${newBlueprints}' WHERE name = '${user}'`;
    connection.query(write, function(err, write_result){
    	connection.release();
    	message_body = `Blueprints learned for ${user} ${newBlueprints} `;
    	send_message(channelID, message_body);
    	});
        }
        else{
        message_body = `No user found`;
                send_message(channelID, message_body);
                connection.release();
			}
    });
});
}
}

//BPs Learned
var bpslearned =function(args, channelID){
	if (args.length < 2){
		message_body = "Format for this command is: !bpslearned <playername>";
		send_message(channelID, message_body);
	}
	else {
		playername = args[1];

		var sql = `SELECT blueprint from blueprints where name = '${playername}'`;
		pool.getConnection(function (err, connection) {
        connection.query(sql, function (err, result) {
        	if (result.length > 0){
        		blueprint = result[0].blueprint;
        		message_body = `Blueprints learned for ${playername} ${blueprint}`;
        		send_message(channelID, message_body);
        		connection.release();
        }
        	else{
        		message_body = `No player found`;
        		send_message(channelID, message_body);
        		connection.release();
        	}
        	    });
});

	}


}


//Send Message Function
var send_message = function (channelID, message_body) {
    bot.sendMessage({
        to: channelID,
        message: message_body
    });
}



//Start !sell
var sell_argcheck = function (args, channelID) {
    if (args.length < 4) {
        message_body = "Format for this command is: !sold <quantity> <name> <currency>.";
        send_message(channelID, message_body);
    }
    if (isNaN(args[1])) {
        message_body = "Format for this command is: !sold <quantity> <name> <currency>.  You must input a number for <quantity>.";
        send_message(channelID, message_body);
    }
    else {
        qty = Number(args[1]);
        invItem = args[2];
        currency = args[3];
        console.log(`Received request to sell ${qty} ${invItem}(s) for ${currency}`);
        console.log(`Attempting to retrieve a connection from the pool`);
        sell_open_conn(qty, invItem, currency, channelID);
    }
    ;
}

var sell_read = function (qty, invItem, currency, channelID, connection) {
    console.log(`Checking to see how many ${invItem}:${currency} are available`);
    var read = `SELECT idInventory,quantity, sold FROM inventory WHERE name = '${invItem}' AND currency = '${currency}'`;
    connection.query(read, function (err, read_result) {
        if (read_result.length > 0) {
            currQty = read_result[0].quantity;
            console.log(`Currently ${currQty} available for sale; ${qty} requested`);
            if (currQty <= 0) {
                console.log(`Zero ${invItem}:${currency} available, killing sale.`);
                message_body = `0 ${invItem}s currently being sold for ${currency}, cannot decrement further.`;
                send_message(channelID, message_body);
            }
            else if (qty > currQty) {
                console.log(`Requested amount (${qty}) exceeds inventory (${currQty}), killing sale.`);
                message_body = `Fewer than ${qty} ${invItem}s selling for ${currency} remaining; invalid sale.`;
                send_message(channelID, message_body);
            }
            else {
                console.log(`Sufficient inventory to proceed with record of sale`);
                sell_write(qty, invItem, currency, channelID, connection, currQty);
            }
        }

        else {
            console.log(`No ${invItem}s are currently being sold in return for ${currency}. Killing sale.`);
            message_body = `No ${invItem}s are currently being sold in return for ${currency}. Killing sale.`;
            send_message(channelID, message_body);
        }
    });
}

var sell_write = function (qty, invItem, currency, channelID, connection, currQty) {
	var read = `SELECT idInventory, quantity, sold, total, price FROM inventory WHERE name = '${invItem}' AND currency = '${currency}'`;
    connection.query(read, function (err, read_result) {
    //console.log(read_result);
    newQty = currQty - qty;
    
    soldQty = read_result[0].sold;
    newSoldQty = soldQty + qty;

    totalQty = read_result[0].total;
    console.log("total qty = " + totalQty);

    price = read_result[0].price;

    newTotalQty = (totalQty + (price * qty));

    console.log(`New ${invItem}:${currency} after sale: ${newQty}`);
    var write = `UPDATE inventory SET quantity = '${newQty}', sold = '${newSoldQty}', total = '${newTotalQty}' WHERE name = '${invItem}' AND currency = '${currency}'`;
    connection.query(write, function (err, write_result) {
        console.log(write_result.affectedRows + " record(s) updated");
        console.log(`Sale complete!`);
        connection.release();
        message_body = `Sold ${qty} ${invItem}s, ${newQty} now in stock.`
        send_message(channelID, message_body);
    });
});
};



var sell_validate_names = function (qty, invItem, currency, channelID, connection) {
    item_arr = new Array();
    var sql = "SELECT DISTINCT LOWER(name) AS name FROM inventory";
    console.log(`Current unique item names in inventory:`);
    console.log();
    connection.query(sql, function (err, result) {
        for (var index in result) {
            item = result[index].name;
            item_arr.push(item);
            console.log(item);
        }
        console.log();
        if (item_arr.indexOf(invItem.toLowerCase()) > -1) {
            console.log(`${invItem} found in inventory. Beginning sale transaction.`);
            sell_read(qty, invItem, currency, channelID, connection);
        }
        else {
            console.log(`${invItem} not found in inventory, killing sale.`);
            message_body = `No valid sell orders for ${invItem}`
            send_message(channelID, message_body);
        }
        ;
    });
}

var sell_open_conn = function (qty, invItem, currency, channelID) {
    pool.getConnection(function (err, connection) {
        console.log(`Conection opened. Checking to see if ${invItem} exists in inventory.`);
        sell_validate_names(qty, invItem, currency, channelID, connection);
    });
}

/*
var sell_multi_orders = function () {
    var invItem = "revolver";
    var currency = "scrap";
    var qty = 40;
    var remaining = qty;
    var channelID = 5;

    var sql = `SELECT SUM(quantity) from inventory WHERE name = '${invItem}' AND currency = '${currency}';`;
    pool.getConnection(function (err, connection) {
        connection.query(sql, function (err, result) {
            console.log(sql);
            console.log(result);
            for (var index in result) {
                if (result.length > 0) {
                    console.log("We've got inventory, now split it up")
                    sql = `SELECT idInventory,quantity from inventory WHERE name = '${invItem}' AND currency = '${currency}';`;
                    //var hashtable = new HashTable();
                    connection.query(sql, function (err, result) {
                        console.log(result);
                        for (var index in result) {
                            avail = result[index].quantity;
                            id = result[index].idInventory;
                            if (remaining > 0) {
                                if (avail <= remaining) {
                                    //hashtable.put(id, avail);
                                    remaining = remaining - avail;
                                }
                                else {
                                    //hashtable.put(id, remaining);
                                    remaining = remaining - remaining;
                                }
                            }
                        }
                        //key_arr = hashtable.keys();
                        for (var index in key_arr) {
                            order_id = key_arr[index];
                            //order_qty = hashtable.get(key_arr[index]);

                            var write = `UPDATE inventory SET quantity = quantity - ${order_qty} WHERE idInventory = ${order_id};`;
                            connection.query(write, function (err, write_result) {
                                console.log(write_result.affectedRows + " record(s) updated");
                            });
                        }
                    });
                }
                else {
                    console.log("We ain't got any")
                }
            }
        });
    });
}
//End !sell
*/


//Start !list
var list_argcheck = function (args, channelID) {
    if (args.length < 5) {
        message_body = "Format for this command is: !list <quantity> <name> <currency> <price>.";
        send_message(channelID, message_body);
    }
    if (isNaN(args[1])) {
        message_body = "Format for this command is: !list <quantity> <name> <currency> <price>.  Your input must be a number for <quantity>.";
        send_message(channelID, message_body);
    }
    if (isNaN(args[4])) {
        message_body = "Format for this command is: !list <quantity> <name> <currency> <price>.  Your input must be a number for <price>.";
        send_message(channelID, message_body);
    }
    else {
        qty = Number(args[1]);
        invItem = args[2];
        currency = args[3];
        price = Number(args[4]);
        console.log(`Received request to list ${qty} ${invItem}(s) for ${currency}`);
        console.log(`Attempting to retrieve a connection from the pool`);
        list_open_conn(qty, invItem, currency, price, channelID);
    }
    ;
}

var list_read = function (qty, invItem, currency, price, channelID, connection) {

    console.log(`Checking to see how many ${invItem}:${currency} are available`);
    var read = `SELECT idInventory, quantity FROM inventory WHERE name = '${invItem}' AND currency = '${currency}'`;
    connection.query(read, function (err, read_result) {
        if (read_result.length >= 0) {
            currQty = read_result[0].quantity;
            //tempvar = true;
            //console.log(tempvar + ' list read check');
            
            //var newQtyList = currQty + qty;

            list_write_update(qty, invItem, currency, price, channelID, connection, currQty);
            //message_body = `Item row exists. Item updated: ${newQtyList} ${invItem}(s), now in stock.`
            //send_message(channelID, message_body);
        }
        else{
            pool.getConnection(function (err, connection) {
            list_write_update(qty, invItem, currency, price, channelID, connection, currQty);
        });

        }
    });
}



var list_write = function (qty, invItem, currency, price, channelID, connection, currQty) {
    var write = `INSERT inventory SET name = '${invItem}',  quantity = '${qty}', price = '${price}', currency = '${currency}' `;
    connection.query(write, function (err, result) {
        console.log(result.affectedRows + " record(s) inserted");
        console.log(`List complete!`);
        connection.release();
        message_body = `New Item added: ${qty} ${invItem}(s), sold for: ${price} ${currency} now in stock.`
        send_message(channelID, message_body);
    });
};

var list_write_update = function (qty, invItem, currency, price, channelID, connection, currQty) {
    var newQtyList = currQty + qty;
    console.log(`New ${invItem}:${currency} after sale: ${newQtyList}`);
    var write = `UPDATE inventory SET quantity = '${newQtyList}' WHERE name = '${invItem}' AND currency = '${currency}'`;
    connection.query(write, function (err, result) {
        console.log(`Record update complete!`);
        connection.release();
        message_body = `Row updated: ${newQtyList} ${invItem}(s), now in stock.`
        send_message(channelID, message_body);
    });
};

var list_open_conn = function (qty, invItem, currency, price, channelID) {
    pool.getConnection(function (err, connection) {
        console.log(`Conection opened. Checking to see if ${invItem} exists in inventory.`);
        list_validate_names(qty, invItem, currency, price, channelID, connection);
    });
}

var list_validate_names = function (qty, invItem, currency, price, channelID, connection) {
    item_arr = new Array();
    var sql = `SELECT DISTINCT LOWER(name) AS name, currency FROM inventory WHERE name = '${invItem}' AND currency = '${currency}'`;
    console.log(`Current unique item/currency combo in inventory:`);
    console.log();
    connection.query(sql, function (err, result) {
  
        if (result.length >= 1) {
            console.log(`${invItem} found in inventory. Updating Inventory.`);
            list_read(qty, invItem, currency, price, channelID, connection);
        }
        else {
            console.log(`${invItem} not found in inventory. Inserting item details.`);
            list_write(qty, invItem, currency, price, channelID, connection);

        }
        ;
    });
}
//End !list

//Start !remove
var remove_argcheck = function (args, channelID) {
    if (args.length < 4) {
        message_body = "Format for this command is: !remove <quantity> <name> <currency>.";
        send_message(channelID, message_body);
    }
    if (isNaN(args[1])) {
        message_body = "Format for this command is: !remove <quantity> <name> <currency>.  Your input must be a number for <quantity>.";
        send_message(channelID, message_body);
    }
    else {
        qty = Number(args[1]);
        invItem = args[2];
        currency = args[3];
        console.log(`Received request to remove ${qty} ${invItem}(s) for ${currency}`);
        console.log(`Attempting to retrieve a connection from the pool`);
        remove_open_conn(qty, invItem, currency, channelID);
    }
}

var remove_open_conn = function (qty, invItem, currency, channelID) {
    pool.getConnection(function (err, connection) {
        console.log(`Conection opened. Checking to see if ${invItem} exists in inventory.`);
        remove_validate_names(qty, invItem, currency, channelID, connection);
    });
}

var remove_validate_names = function (qty, invItem, currency, channelID, connection) {
    item_arr = new Array();
    var sql = `SELECT DISTINCT LOWER(name) AS name, currency FROM inventory WHERE name = '${invItem}' AND currency = '${currency}'`;
    console.log(`Current unique item/currency combo in inventory:`);
    console.log();
    connection.query(sql, function (err, result) {
  
        if (result.length >= 1) {
            console.log(`${invItem} found in inventory. Proceed to update confirmation.`);
            remove_read(qty, invItem, currency, channelID, connection);
        }
        else {
            message_body = `Item not found in inventory. Nothing to remove.`;
            send_message (channelID, message_body);

        }
        ;
    });
}

var remove_read = function (qty, invItem, currency, channelID, connection) {

	var read = `SELECT idInventory,quantity, sold FROM inventory WHERE name = '${invItem}' AND currency = '${currency}'`;
    connection.query(read, function (err, read_result) {
        if (read_result.length > 0) {
            currQty = read_result[0].quantity;
            console.log(`Currently ${currQty} available for sale; ${qty} requested`);
            if (currQty <= 0) {
                console.log(`Zero ${invItem}:${currency} available, killing sale.`);
                message_body = `0 ${invItem}s currently being sold for ${currency}, cannot decrement further.`;
                send_message(channelID, message_body);
            }
            else if (qty > currQty) {
                //console.log(`Requested amount (${qty}) exceeds inventory (${currQty}), killing remove.`);
                message_body = `Fewer than ${qty} ${invItem}s selling for ${currency} remaining; invalid removal.`;
                send_message(channelID, message_body);
            }
            else {
    console.log(`Checking to see how many ${invItem}:${currency} are available`);
    var read = `SELECT idInventory, quantity FROM inventory WHERE name = '${invItem}' AND currency = '${currency}'`;
    connection.query(read, function (err, read_result) {
        if (read_result.length >= 0) {
            currQty = read_result[0].quantity;
            //tempvar2 = true;
            //console.log(tempvar + ' list read check');

            //message_body = `Item row exists. Currently ${currQty} available for sale. Do you want to remove from ${qty} inventory?  !Y / !N.`
            //send_message(channelID, message_body);
			pool.getConnection(function (err, connection) {
            remove_write_update(qty, invItem, currency, channelID, connection, currQty);
            });

        }
        else{
            	message_body = `No row found to remove.`;
            }
    });
    }
    }

});
}


var remove_write_update = function (qty, invItem, currency, channelID, connection, currQty) {
    var newQtyList = currQty - qty;
    //console.log(`New ${invItem}:${currency} after sale: ${newQtyList}`);

    var write = `UPDATE inventory SET quantity = '${newQtyList}' WHERE name = '${invItem}' AND currency = '${currency}'`;
    connection.query(write, function (err, result) {
        console.log(`Record update complete!`);
        connection.release();
        message_body = `Item(s) removed: ${newQtyList} ${invItem}(s), now in stock.`
        send_message(channelID, message_body);
    });
};
//end !remove


//Start !kill
var kill_argcheck = function (args, channelID, user) {
    if (args.length < 2) {
        message_body = "Format for this command is: !kill <name>.";
        send_message(channelID, message_body);
    }
    else {
        playerKilled = args[1];
        kill_open_conn(playerKilled, channelID, user);
    }
    ;
}

var kill_open_conn = function (playerkilled, channelID, user) {
    pool.getConnection(function (err, connection) {
        console.log(`Conection opened.`);
        kill_add(playerkilled, channelID, user, connection);
    });
}

var kill_add = function (playerKilled, channelID, user, connection) {
    var write = `INSERT killcount SET Player = '${user}',  PlayerKilled = '${playerKilled}' `;

    connection.query(write, function (err, result) {
        //console.log(result);
        connection.release();
        //message_body = `New kill recorded:  ${user} cucked ${playerKilled}.`
        //send_message(channelID, message_body);
    });

};

var kill_stats = function(channelID, user){
    pool.getConnection(function (err, connection) {
    var sql = `SELECT Player, PlayerKilled FROM killcount WHERE Player = '${user}' `;
    connection.query(sql, function(err, result){
        //console.log(result);
        connection.release();
        var message_body = '';
            for (var index in result) {
                message_body += `${result[index].Player} - ${result[index].PlayerKilled}\n`;
            }
            if (result.length <= 0){
                message_body = 'No Rows found.';
                send_message(channelID, message_body);
            }
            else{
        send_message(channelID, message_body);
            }
        });
    });
    };
//End !kill

