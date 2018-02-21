var Discord = require('discord.io');
var logger = require('winston');
var mysql = require('mysql');
//var Table = require('tty-table');
//var chalk = require('chalk');


//Table Start
/*
var header = [
	{
		value: "header1",
		headerColor : "red",
		color: "white",
		aligh: "left",
		paddingLeft: 5,
		width : 30
	}

];

var rows = [
	["test"],
	["test1"]

];

var footer = [
  "TOTAL",
  (function(){
    return rows.reduce(function(prev,curr){
      return prev+curr[1]
    },0)
  }()),
  (function(){
    var total = rows.reduce(function(prev,curr){
      return prev+((curr[2]==='yes') ? 1 : 0);
    },0);
    return (total/rows.length*100).toFixed(2) + "%";
  }())];
*/

  


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

bot.on('message', function (user, userID, channelID, message, evt) {

    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        switch (cmd) {
            case 'ping':
                ping(channelID);
                break;

            case 'sold':
                sell_argcheck(args, channelID);
                break;

            case 'Wonderful!':
                wunderbar(channelID);
                break;

            case 'inv':
                inv_check(channelID);
                break;

            case 'multi':
                sell_multi_orders();
                break;

            case 'list':
              list_argcheck(args, channelID);
              break;

            case 'help':
            	help(channelID);
            	break;

            case 'dump':
                dump(channelID);
                break;

            case 'fart':
                fart(channelID);
                break;

            case 'poop':
                poop(channelID);
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

            case 'table':
                table_test(channelID);
                break;

        }
    }
});


var help = function (channelID) {
   message_body = "The following commands are available: \n!sold <quantity> <name> <currency> ---Track item sales \n!list <quantity> <name> <currency> <price> ---List new items to inventory \n!inv ---Check current inventory";  
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
var wunderbar = function (channelID) {
    message_body = "Wunderbar!";
    send_message(channelID, message_body);
};


var dump = function (channelID) {
   message_body = "Uhhh ohhhh... I just shit my pants.";  
   send_message(channelID, message_body);
};

var fart = function (channelID) {
   message_body = "Whoa.  That one was smelly.  And wet...";  
   send_message(channelID, message_body);
};

var poop = function (channelID) {
   message_body = "What the hell!  No toilet paper! FML";  
   send_message(channelID, message_body);
};

var makinplays = function (channelID) {
   message_body = "MAKIN PLAYS!!!";  
   send_message(channelID, message_body);
};

/*
//Table Test
var table_test = function(chanelID){
var t1 = Table(header,rows,footer,{
  borderStyle : 1,
  borderColor : "blue",
  paddingBottom : 0,
  headerAlign : "center",
  align : "center",
  color : "white",
  truncate: "..."
});

str1 = t1.render();
console.log(str1);

}

*/

//Inventory Check
var inv_check = function (channelID) {
    var sql = "select * from inventory;"
    pool.getConnection(function (err, connection) {
        connection.query(sql, function (err, result) {
            if (err) throw err;
            connection.release();
            console.log(result.length);
            var message_body = '';
            for (var index in result) {
                message_body += `${result[index].Quantity} - ${result[index].Name} - ${result[index].Currency} - ${result[index].Price} - ${result[index].Sold}\n`;
            }
            console.log(message_body);
            send_message(channelID, message_body);
        });
    });
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
	var read = `SELECT idInventory,quantity, sold FROM inventory WHERE name = '${invItem}' AND currency = '${currency}'`;
    connection.query(read, function (err, read_result) {
    newQty = currQty - qty;
    soldQty = read_result[0].sold;
    newSoldQty = soldQty + qty;
    console.log(`New ${invItem}:${currency} after sale: ${newQty}`);
    var write = `UPDATE inventory SET quantity = '${newQty}', sold = '${newSoldQty}' WHERE name = '${invItem}' AND currency = '${currency}'`;
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

            message_body = `Item row exists. Currently ${currQty} available for sale. Do you want to update inventory?  ~Y / ~N.`
            send_message(channelID, message_body);
            //console.log(`Currently ${currQty} available for sale. Updating Inventory.`);
            
            bot.on('message', function (user, userID, channelID, message, evt) {
            if (message.substring(0, 1) == '~') {
            var args = message.substring(1).split(' ');
            var confirm = args[0];
            switch (confirm) {
                case 'Y':
                list_write_update(qty, invItem, currency, price, channelID, connection, currQty);
                break;

                case 'N':
                message_body = `List update for ${invItem} cancelled.`
                send_message(channelID, message_body);
                break;
                    }
                 }
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
        //console.log(result.affectedRows + " record(s) updated");
        console.log(`Record update complete!`);
        connection.release();
        message_body = `Item updated: ${newQtyList} ${invItem}(s), now in stock.`
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
    //new_arr = new Array(item_arr);
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

