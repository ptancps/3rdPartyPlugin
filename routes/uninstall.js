const express = require('express'),
router = express.Router(),
sql = require('mssql'),
BigCommerce = require('node-bigcommerce');


require('dotenv').config();


const bigCommerce = new BigCommerce({
secret: process.env.SECRET,
responseType: 'json'
});

const {
    CLIENT_ID,
    SECRET,
    HOST,
    DB_USER,
	DB_PW,
	DB_SERVER,
    DB_DATABASE,
    MAILGUN_API_KEY
} = process.env

//database connection
const dbConfig = {
	user: DB_USER,
	password: DB_PW,
	server: DB_SERVER, 
	database: DB_DATABASE 
};

// connect to your database
sql.connect(dbConfig, function (err) {    
    if (err){
        console.log(err);
    } else{
        console.log("Successfully connected to database");				
    }
});

//create Request object
var request = new sql.Request();



router.get('/', (req, next) => {
try {
const data = bigCommerce.verify(req.query['signed_payload']);
console.log("uninstalled")
console.log(data)
var sqlString = `update cps_bigcommerce_app_installs set status =2 where store = '${data.context}'`
console.log(sqlString)
request.query(sqlString, (err, recordset) => {	
    if (err) {
        console.log(err)           
    }else{
      

        request.query(`select cd.dealer_name as dealername, * from cps_bigcommerce_app_installs a inner join cps_dealers cd on cd.id = a.dealerid where store = '${data.context}'`, (err, recordset) => {	
            if (err) {
                console.log(err)           
            }else{
                if(recordset.recordset.length > 0){
                var d = new Date(); /* midnight in China on April 13th */
               var time = d.toLocaleString('en-US', { timeZone: 'America/New_York' });
                var api_key = MAILGUN_API_KEY;   
                var from_who = 'noreply@cpscentral.com';
                var html = `Dealer ID: ${recordset.recordset[0].dealerid} <br /> Link: <a href="https://app.cpscentral.com/admside/dealer.aspx?dealerid=${recordset.recordset[0].dealerid}">https://app.cpscentral.com/admside/dealer.aspx?dealerid=${recordset.recordset[0].dealerid}</a> <br/> Dealer Name: ${recordset.recordset[0].dealername} <br /> Website: ${recordset.recordset[0].domain} <br /> Touchpoint: App Uninstalled. <br /> Date/time of change. ${time} `
                console.log(html)
                        var dataMail = {
                            from: 'noreply@cpscentral.com',
                            to: 'trubin@cpscentral.com,jheffez@cpscentral.com', 
                            subject: `${recordset.recordset[0].dealerid} - ${recordset.recordset[0].dealername} - App Uninstalled`,
                            html
                            }
            
                      mailgun.messages().send(dataMail, function (err, body) {
                          if (err) {
                              console.log("got an error: ", err);
                          }
                          else {
                          }
                      });
                    }
            }	            
        });




    }	            
});
console.log(data);
} catch (err) {
next(err);
}
});

module.exports = router;