const express = require('express'),
router = express.Router(),
BigCommerce = require('node-bigcommerce');
var sql = require('mssql')
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

router.get('/', (req, res, next) => {
    try {
        const data = bigCommerce.verify(req.query['signed_payload']);
        console.log(data)
        
        request.query(`select * from cps_bigcommerce_app_installs where store_hash = '${data.store_hash}'`, (err, recordset) => {	
            if (err) {
            }else{
                if (recordset.recordset.length > 0) {
                   
                        res.cookie('storehash', recordset.recordset[0].store_hash, { httpOnly: true, secure: true, sameSite: 'none' });
                   
                    
                   if(recordset.recordset[0].onboardstatus == 0){
                       console.log(recordset.recordset[0])
                        res.render('onboard', { user: recordset.recordset[0].username, data:  recordset.recordset[0]})
                   }else{
                    var warrantyRevenue = 0.0
                    var newWarrantyOrders = 0
                    var attachmentRate = 0
                    var monthlySalesArray = []
                    var monthlySalesMonthArray = []
                    var warrantyRevArray = []
                    var warrantyRevMonthArray = []

                    var date;
                    var date2;


function getFormattedDate() {
    var start = new Date();
  
   var year = start.getFullYear();
 
   var month = (1 + start.getMonth()).toString();
   month = month.length > 1 ? month : '0' + month;
 
   var day = start.getDate().toString();
   day = day.length > 1 ? day : '0' + day;
   
   return month + '/' + day + '/' + year;
 }

 function getFormattedDate2(date) {
    var start = new Date(date);
  
   var year = start.getFullYear();
 
   var month = (1 + start.getMonth()).toString();
   month = month.length > 1 ? month : '0' + month;
 
   var day = start.getDate().toString();
   day = day.length > 1 ? day : '0' + day;
   
   return month + '/' + day + '/' + year;
 }




    date = getFormattedDate()
    date2 = getFormattedDate()


                    request.query(`select DATENAME (month, convert(varchar(10), cast(dateadded as date), 120)) as dateadded, isnull(sum(quantity), 0) as 
                    count from cps_bigcomm_app_orders_items where is_warranty = 1 and year(dateadded) = ${new Date().getFullYear()} and  storeid = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.cookies.storehash}')
                    group by DATENAME (month, convert(varchar(10), cast(dateadded as date), 120)), datepart(month, convert(varchar(10), cast(dateadded as date), 120))
                    order by datepart(month, convert(varchar(10), cast(dateadded as date), 120))`,
                    (err, recordset) => {
                        if (err) {
                            console.log(err)
                        } else {
                            for(var i = 0; i<recordset.recordset.length; i++){
                                monthlySalesArray.push(recordset.recordset[i].count)
                                monthlySalesMonthArray.push(recordset.recordset[i].dateadded)
                            }

                            request.query(`select DATENAME (month, convert(varchar(10), cast(dateadded as date), 120)) as dateadded, isnull(sum(quantity * price), 0) as amount_sold from cps_bigcomm_app_orders_items
            where is_warranty = 1 and year(cast(dateadded as date)) = ${new Date().getFullYear()} and  storeid = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.cookies.storehash}')  group by DATENAME (month, convert(varchar(10), cast(dateadded as date), 120)), datepart(month, convert(varchar(10), cast(dateadded as date), 120))
            order by datepart(month, convert(varchar(10), cast(dateadded as date), 120))`,
            (err, recordset) => {
                if (err) {
                    console.log(err)
                } else {
                    for(var i = 0; i<recordset.recordset.length; i++){
                        warrantyRevArray.push(recordset.recordset[i].amount_sold)
                        warrantyRevMonthArray.push(recordset.recordset[i].dateadded)
                    }

                    console.log(warrantyRevArray)
                    console.log(warrantyRevMonthArray)
                }
            });
                            
                        }
                    });



                                        
                                        
                    request.query(`select isnull(sum(a.price * quantity), 0) as sold_price_total from cps_bigcomm_app_orders_items a inner join cps_products cp on cp.warrantycode = a.sku
                    inner join dealers_prices_index dpi on dpi.productid = cp.id and dpi.dealerid = (select dealerid from cps_bigcommerce_app_installs where store_hash = '${recordset.recordset[0].store_hash}')
                    where a.is_warranty = 1 and convert(varchar, cast(a.dateadded as date), 101) = '${date}' and a.storeid=(select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.cookies.storehash}')`,
                    (err, recordset) => {
                        if (err) {
                            console.log(err)
                        } else {
                            warrantyRevenue = recordset.recordset[0].sold_price_total
                            console.log("warrantyRevenue" + warrantyRevenue) 


                            request.query(`select isnull(sum(quantity), 0) as count_orders from cps_bigcomm_app_orders_items a inner join cps_products cp on cp.warrantycode = a.sku
                            inner join dealers_prices_index dpi on dpi.productid = cp.id and dpi.dealerid = (select dealerid from cps_bigcommerce_app_installs where store_hash = '${req.cookies.storehash}')
                            where a.is_warranty = 1 and convert(varchar, cast(a.dateadded as date), 101) = '${date}' and a.storeid=(select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.cookies.storehash}') `,
                            (err, recordset) => {
                                if (err) {
                                    console.log(err)
                                } else {
                              
                                    newWarrantyOrders = recordset.recordset[0].count_orders
                                    console.log("newWarrantyOrderss" + newWarrantyOrders) 

                                    request.query(`select isnull(sum(quantity),0) as count_primaryproduct from cps_bigcomm_app_orders_items a where a.storeid = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.cookies.storehash}')
                                    and a.is_warranty = 0 and convert(varchar, cast(a.dateadded as date), 101) = '${date}'  `,
                                    (err, recordset) => {
                                        if (err) {
                                            console.log(err)
                                        } else {
                                     
                                            request.query(`select isnull(sum(quantity),0) as count_warrantyproduct from cps_bigcomm_app_orders_items a where a.storeid = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.cookies.storehash}')
                                            and a.is_warranty = 1 and convert(varchar, cast(a.dateadded as date), 101) = '${date}' `,
                                            (err, recordset2) => {
                                                if (err) {
                                                    console.log(err)
                                                } else {
                                                attachmentRate = (recordset2.recordset[0].count_warrantyproduct/recordset.recordset[0].count_primaryproduct) * 100
                                                if (isNaN(attachmentRate)){
                                                    attachmentRate = 0
                                                }
                
                                                if (recordset.recordset[0].count_primaryproduct == 0 && recordset2.recordset[0].count_warrantyproduct > 0){
                                                    attachmentRate = 100
                                                }

                                                if (recordset2.recordset[0].count_warrantyproduct > recordset.recordset[0].count_primaryproduct){
                                                    attachmentRate = 100
                                                }
                                                
                                                  console.log("attachmentRate" + Math.round(attachmentRate)) 
                                                  res.render('welcome', {warrantyRevMonthArray, warrantyRevArray, monthlySalesMonthArray, monthlySalesArray, newinstall: 0,  user: data.user.email, onboardstatus: recordset.recordset[0].onboardstatus, revenue: warrantyRevenue, orderTotal: newWarrantyOrders, attachmentRate: Math.round(attachmentRate)});
                                                }
                                            });
                                        }
                                    });
                                }
                            });

                        }
                    });
                                        
                   
               
                        
                   }
                }else{
                    res.render('welcome', { user: data.user.email, newinstall: 0 });
                }
            }	            
        }); 
      
        
    } catch (err) {
    next(err);
    }
});

module.exports = router;