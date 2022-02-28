var express = require('express');
var router = express.Router();
var sql = require('mssql')
var bodyParser = require('body-parser')
var BigCommerce = require('node-bigcommerce');
var fetch = require("node-fetch")
const url = require('url');

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

var api_key = MAILGUN_API_KEY;
var domain = 'cpscentral.com';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});


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




/* GET home page. */
router.get('/', function(req, res, next) {
console.log('homepage');
  res.render('index', { title: 'Express' });
});

/* GET products page. */
router.get('/products', function(req, res, next) {
   
    
     
    var products = []
    var sql = `select  CASE
    WHEN warrantable = 0 THEN 'Pending'
    WHEN warrantable = 2 THEN 'Not Warrantable'
    WHEN warrantable > 3 THEN 'Warranties Activated'
    ELSE ''
END as warrantystatus, * from cps_bigcomm_app_products where not exists(select * from cps_products where warrantycode = cps_bigcomm_app_products.sku) and bc_store_id = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}')  order by dateadded desc `
request.query(sql,
(err, recordset) => {
  if (err) {
      console.log(err)
  } else {
     
      products = recordset.recordset
      res.render('products', {
        title: 'Express',
        selection: req.query.selection,
        products
    });
  }
});


    
//     var resultPerPage = 25
//     var restultTotalPages = 0 
//     var page = 1
//     var resultTotalCount = 0 

//     console.log(req.query.p)
//     if(req.query.p && req.query.p !== "undefined"  && req.query.p !== null){
//         page = req.query.p
//     }
//     console.log("page: " + page)

//     console.log(req.cookies)
//   var products = []


//   request.query(`select count(*) as count from cps_bigcomm_app_products where not exists(select * from cps_products where warrantycode = cps_bigcomm_app_products.sku) and bc_store_id = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}') `,
//   (err, recordset) => {
//       if (err) {
//           console.log(err)
//       } else {
//         resultTotalCount = recordset.recordset[0].count
//         console.log("resultTotalCount" + resultTotalCount) 
        
        

//         var t = resultTotalCount / resultPerPage;
//         if(t * resultPerPage < resultTotalCount){
//             t += 1
//         }
            
//         restultTotalPages = Math.ceil(t)
//         console.log("restultTotalPages: " + restultTotalPages)


       


//         var sql = `select  CASE
//         WHEN warrantable = 0 THEN 'Pending'
//         WHEN warrantable = 2 THEN 'Not Warrantable'
//         WHEN warrantable > 3 THEN 'Warranties Activated'
//         ELSE ''
//     END as warrantystatus, * from cps_bigcomm_app_products where not exists(select * from cps_products where warrantycode = cps_bigcomm_app_products.sku) and bc_store_id = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}')  order by dateadded desc `
//   sql += " OFFSET " + (page - 1) * resultPerPage + " ROWS FETCH NEXT " + resultPerPage + " ROWS ONLY"
//   console.log(sql)
//   request.query(sql,
//   (err, recordset) => {
//       if (err) {
//           console.log(err)
//       } else {
//           var fromCount = 0 
//           if(page == 1){
//             fromCount = 1
//           }else{
//             fromCount = ((page - 1) * resultPerPage)
//           }

//         var toCount = 0 

//         if(page == restultTotalPages){
//             toCount = resultTotalCount
//           } else if(page == 1){
//             toCount = resultPerPage
//           }else{
//             toCount = (((page - 1) * resultPerPage) + resultPerPage)
//           }

//           products = recordset.recordset
//           res.render('products', {
//               title: 'Express',
//               selection: req.query.selection,
//               perpage: resultPerPage,
//               totalcount: resultTotalCount,
//               fromCount,
//               toCount,
//               products,
//               pagination: {
//                 page,
//                 pageCount: restultTotalPages
//               }
//           });
//       }
//   });

//       }
//   });


  
  
  
  });


  router.post("/form_submit", function(req, res){
      console.log(req.body.textbody)
    var name = "";
    var dealerid = "";
    var domain = "";
      request.query(`select * from cps_bigcommerce_app_installs where  store_hash = '${req.query.storehash}' `,
      (err, recordset) => {
          if (err) {
              console.log(err)
          } else {
            name = recordset.recordset[0].first_name + " " +  recordset.recordset[0].last_name
            dealerid = recordset.recordset[0].dealerid
            domain = recordset.recordset[0].domain

            
      	var api_key = MAILGUN_API_KEY;   
          var from_who = 'yanteb@gmail.com';
  var html = `Name: ${name} <br /> Dealer id: ${dealerid} <br/> Website: ${domain} <br /> Message: ${req.body.textbody}`
  console.log(html)
          var dataMail = {
                from: 'noreply@cpscentral.com',
                to: 'nantebi@cpscentral.com', 
                subject: 'Form Submission from dealer via Bigcommerce app',
                html
              }

              if(req.body.textbody.length > 0){
                mailgun.messages().send(dataMail, function (err, body) {
                    if (err) {
                        console.log("got an error: ", err);
                    }
                    else {
                        res.json({ return:true })
                    }
                });
              }else{
                res.redirect("/home")
              }
  
                
          }
      });
     


  })



  router.get('/warranty_rev_selection', function(req, res, next) {
      console.log(req.query.selection)
      var warrantyRevArray = []
    var warrantyRevMonthArray = []
    var sql;

      switch(req.query.selection) {
        case 'today':
            console.log("today")
             sql = `select  convert(varchar(10), cast(dateadded as date), 120) as dateadded, isnull(sum(quantity * price), 0) as amount_sold from cps_bigcomm_app_orders_items
             where is_warranty = 1  and  storeid = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}') and  dateadded >  convert(varchar(10), getdate(), 120)  group by convert(varchar(10), cast(dateadded as date), 120)
             order by  convert(varchar(10), cast(dateadded as date), 120)`
            break;
        case 'week':
            console.log("week")
             sql = `	select convert(varchar(10), cast(dateadded as date), 120) as dateadded   , isnull(sum(quantity * price), 0) as amount_sold from cps_bigcomm_app_orders_items
             where is_warranty = 1  and  storeid = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}') and  dateadded between  DATEADD(day,-7, GETDATE()) and getdate()  group by convert(varchar(10), cast(dateadded as date), 120)
             order by  convert(varchar(10), cast(dateadded as date), 120)`
          break;
        case 'month':
            console.log("month")
            sql = `select DATENAME (month, convert(varchar(10), cast(dateadded as date), 120)) as dateadded, isnull(sum(quantity * price), 0) as amount_sold from cps_bigcomm_app_orders_items
            where is_warranty = 1 and year(dateadded) = ${new Date().getFullYear()} and  storeid = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}') group by DATENAME (month, convert(varchar(10), cast(dateadded as date), 120)), datepart(month, convert(varchar(10), cast(dateadded as date), 120))
            order by datepart(month, convert(varchar(10), cast(dateadded as date), 120))`
            // sql = `select  convert(varchar(10), dateadded, 120) as dateadded, isnull(sum(quantity * price), 0) as amount_sold from cps_bigcomm_app_orders_items
            // where is_warranty = 1  and  storeid = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}') and  dateadded >  convert(varchar(10), DATEADD(month,-1, GETDATE()), 120) group by convert(varchar(10), dateadded, 120)
            // order by  convert(varchar(10), dateadded, 120) `
          break
          case 'year':
            console.log("year")
            sql = `	select DATENAME (year, convert(varchar(10), cast(dateadded as date), 120)) as dateadded, isnull(sum(quantity * price), 0) as amount_sold from cps_bigcomm_app_orders_items
            where is_warranty = 1 and  storeid = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}') group by DATENAME (year, convert(varchar(10), cast(dateadded as date), 120)), datepart(year, convert(varchar(10), cast(dateadded as date), 120))
            order by datepart(year, convert(varchar(10), cast(dateadded as date), 120))`
              // sql = `select  convert(varchar(10), dateadded, 120) as dateadded, isnull(sum(quantity * price), 0) as amount_sold from cps_bigcomm_app_orders_items
            // where is_warranty = 1  and  storeid = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}') and  dateadded >  convert(varchar(10), DATEADD(year,-1, GETDATE()), 120) group by convert(varchar(10), dateadded, 120)
            // order by  convert(varchar(10), dateadded, 120) `
            
          break
        default:
            console.log("today")
      }
      console.log(sql)


         
    request.query(sql,
    (err, recordset) => {
        if (err) {
            console.log(err)
        } else {
            for(var i = 0; i<recordset.recordset.length; i++){
                warrantyRevArray.push(recordset.recordset[i].amount_sold)
                warrantyRevMonthArray.push(recordset.recordset[i].dateadded)
            }
            res.json({ warrantyRevMonthArray, warrantyRevArray })
        }
    });
  })



  /* GET home page. */
router.get('/homewithdate', function(req, res, next) {
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
    
    
    date = req.query.date
    console.log("query date = backedn" + date)

    date2 = req.query.date2
    console.log("query date2 = backedn" + date2)
    
    if(date == undefined){
        date = getFormattedDate()
        console.log(date)
    }else{
        date = getFormattedDate2(date)
        console.log("formatted date backedn" +date)
    }

    if(date2 == undefined){
        date2 = getFormattedDate()
        console.log(date2)
    }else{
        //date2 = getFormattedDate2(date2)
        console.log("formatted date2 backedn" +date2)
    }
    

    
    request.query(`select isnull(sum(a.price * quantity), 0) as sold_price_total from cps_bigcomm_app_orders_items a inner join cps_products cp on cp.warrantycode = a.sku
    inner join dealers_prices_index dpi on dpi.productid = cp.id and dpi.dealerid = (select dealerid from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}')
    where a.is_warranty = 1  and cast (dateadded as date) between '${date}' and  '${date2}' and a.storeid=(select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}')`,
    (err, recordset) => {
        if (err) {
            console.log(err)
        } else {
            warrantyRevenue = recordset.recordset[0].sold_price_total
          console.log("warrantyRevenue" + warrantyRevenue) 
          request.query(`select isnull(sum(quantity),0) as count_orders from cps_bigcomm_app_orders_items a inner join cps_products cp on cp.warrantycode = a.sku
    inner join dealers_prices_index dpi on dpi.productid = cp.id and dpi.dealerid = (select dealerid from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}')
    where a.is_warranty = 1 and cast (dateadded as date) between '${date}' and '${date2}' and a.storeid=(select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}')`,
    (err, recordset) => {
        if (err) {
            console.log(err)
        } else {
     
          newWarrantyOrders = recordset.recordset[0].count_orders
          console.log("newWarrantyOrders" + newWarrantyOrders) 

          request.query(`select isnull(sum(quantity),0) as count_primaryproduct from cps_bigcomm_app_orders_items a where a.storeid = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}')
          and a.is_warranty = 0  and cast (dateadded as date) between '${date}' and '${date2}'`,
          (err, recordset) => {
              if (err) {
                  console.log(err)
              } else {
           
                  request.query(`select isnull(sum(quantity),0) as count_warrantyproduct from cps_bigcomm_app_orders_items a where a.storeid = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}')
                  and a.is_warranty = 1 and cast (dateadded as date) between '${date}' and '${date2}'`,
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

                        console.log("attachmentRate" + Math.round(attachmentRate) )
                        console.log("newWarrantyOrders2 " + newWarrantyOrders) 
                        console.log("warrantyRevenue2 " + warrantyRevenue) 
                        res.json({ selection: req.query.selection, revenue: warrantyRevenue, orderTotal: newWarrantyOrders, attachmentRate: Math.round(attachmentRate)})
                      }
                  });
              }
          });

        }
    });
    
        }
    });
    
    
    
    
    
  
    
    
    
      
    });









/* GET home page. */
router.get('/home', function(req, res, next) {
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

console.log(date,date2)

request.query(`select DATENAME (month, convert(varchar(10), cast(dateadded as date), 120)) as dateadded, isnull(sum(quantity), 0) as 
count from cps_bigcomm_app_orders_items where is_warranty = 1 and year(dateadded) = ${new Date().getFullYear()} and  storeid = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}')
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
where is_warranty = 1 and year(dateadded) = ${new Date().getFullYear()} and  storeid = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}') group by DATENAME (month, convert(varchar(10), cast(dateadded as date), 120)), datepart(month, convert(varchar(10), cast(dateadded as date), 120))
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
inner join dealers_prices_index dpi on dpi.productid = cp.id and dpi.dealerid = (select dealerid from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}')
where a.is_warranty = 1  and cast (a.dateadded as date) = '${date}' and a.storeid=(select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}') `,
(err, recordset) => {
    if (err) {
        console.log(err)
    } else {
        warrantyRevenue = recordset.recordset[0].sold_price_total
      console.log("warrantyRevenue" + warrantyRevenue) 

      request.query(`select isnull(sum(quantity),0) as count_orders from cps_bigcomm_app_orders_items a inner join cps_products cp on cp.warrantycode = a.sku
inner join dealers_prices_index dpi on dpi.productid = cp.id and dpi.dealerid = (select dealerid from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}')
where a.is_warranty = 1 and cast (a.dateadded as date) = '${date}' and a.storeid=(select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}') `,
(err, recordset) => {
    if (err) {
        console.log(err)
    } else {
 
      newWarrantyOrders = recordset.recordset[0].count_orders
      console.log("newWarrantyOrders" + newWarrantyOrders) 

      request.query(`select isnull(sum(quantity),0) as count_primaryproduct from cps_bigcomm_app_orders_items a where a.storeid = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}')
and a.is_warranty = 0  and cast (a.dateadded as date) = '${date}' `,
(err, recordset) => {
    if (err) {
        console.log(err)
    } else {
 
        request.query(`select isnull(sum(quantity),0) as count_warrantyproduct from cps_bigcomm_app_orders_items a where a.storeid = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}')
		and a.is_warranty = 1 and cast (a.dateadded as date) = '${date}'`,
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

              console.log("attachmentRate" + Math.round(attachmentRate) )
              if(req.query.newinstall !== undefined && req.query.newinstall !== "undefined" && req.query.newinstall.length > 0 && req.query.newinstall == 1  ){
                res.render('welcome', { warrantyRevMonthArray, warrantyRevArray, monthlySalesMonthArray, monthlySalesArray, newinstall: 1, selection: req.query.selection, revenue: warrantyRevenue, orderTotal: newWarrantyOrders, attachmentRate: Math.round(attachmentRate),storeHash:req.query.storehash,appUrl:req.query.appurl});
              }else{
              res.render('welcome', { warrantyRevMonthArray, warrantyRevArray, monthlySalesMonthArray, monthlySalesArray, newinstall: 0, selection: req.query.selection, revenue: warrantyRevenue, orderTotal: newWarrantyOrders, attachmentRate: Math.round(attachmentRate),storeHash:req.query.storehash,appUrl:req.query.appurl});
              }
            }
        });
    }
});
    }
});


    }
});








  
});

/* GET orders page. */
router.get('/orders', function(req, res, next) {
   
    var orders = []
    var sql = `select FORMAT(dateadded, 'MM/dd/yy'), * from cps_bigcomm_app_orders_items where is_warranty = 1 and storeid = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}') order by dateadded desc`
request.query(sql,
(err, recordset) => {
  if (err) {
      console.log(err)
  } else {
     
    orders = recordset.recordset
      res.render('orders', {
        title: 'Express',
        selection: req.query.selection,
        orders
    });
  }
});


//     var storeHash = req.query.storehash
//     var resultPerPage = 25
//     var restultTotalPages = 0 
//     var page = 1
//     var resultTotalCount = 0 

//     console.log(req.query.p)

//     if(req.query.p && req.query.p !== "undefined"  && req.query.p !== null){
//         page = req.query.p
//     }
  
//     console.log(req.cookies)
//     var orders = []

//     request.query(`select count(*) as count from cps_bigcomm_app_orders_items where is_warranty = 1 and storeid = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}' ) `,
//   (err, recordset) => {
//       if (err) {
//           console.log(err)
//       } else {
//         resultTotalCount = recordset.recordset[0].count
//         console.log("resultTotalCount" + resultTotalCount) 

//         var t = resultTotalCount / resultPerPage;
//         if(t * resultPerPage < resultTotalCount){
//             t += 1
//         }
            
//         restultTotalPages = Math.ceil(t)
//         console.log("restultTotalPages: " + restultTotalPages)


//         var sql = `select FORMAT(dateadded, 'MM/dd/yy'), * from cps_bigcomm_app_orders_items where is_warranty = 1 and storeid = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}') order by dateadded desc `
//         sql += " OFFSET " + (page - 1) * resultPerPage + " ROWS FETCH NEXT " + resultPerPage + " ROWS ONLY"
//         console.log(sql)
//         request.query(sql,
//   (err, recordset) => {
//       if (err) {
//           console.log(err)
//       } else {

//         var fromCount = 0 
//         if(page == 1){
//           fromCount = 1
//         }else{
//           fromCount = ((page - 1) * resultPerPage)
//         }

//       var toCount = 0 

//       if(page == restultTotalPages){
//           toCount = resultTotalCount
//         } else if(page == 1){
//           toCount = resultPerPage
//         }else{
//           toCount = (((page - 1) * resultPerPage) + resultPerPage)
//         }

//         orders = recordset.recordset
//           res.render('orders', {
//               title: 'Express',
//               selection: req.query.selection,
//               perpage: resultPerPage,
//               totalcount: resultTotalCount,
//               fromCount,
//               toCount,
//               orders,
//               pagination: {
//                 page,
//                 pageCount: restultTotalPages
//               }
//           });
//       }
//   });
      
//       }
//   });



  
});


router.get('/faq', function(req, res, next) {
    res.render('faq', { selection: req.query.selection });
})


/* GET pricing page. */
router.get('/pricing', function(req, res, next) {

    var pricing = []
    var sql = `select cba.sku as sku, a.price as cost, cba.item_id, b.msrp as msrp, cba.price as dealer_price, cba.product_title as productitle from dealers_prices_index a inner join cps_products b on b.id = a.productid  inner join cps_bigcomm_app_products cba on cba.sku = b.warrantycode where dealerid = (select dealerid from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}') and cba.bc_store_id = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}') order by a.id desc `
request.query(sql,
(err, recordset) => {
  if (err) {
      console.log(err)
  } else {
     
    pricing = recordset.recordset
      res.render('pricing', {
        title: 'Express',
        selection: req.query.selection,
        pricing
    });
  }
});


    
//     var resultPerPage = 25
//     var restultTotalPages = 0 
//     var page = 1
//     var resultTotalCount = 0 

//     console.log(req.query.p)
//     if(req.query.p && req.query.p !== "undefined"  && req.query.p !== null){
//         page = req.query.p
//     }
//     console.log("page: " + page)

//     console.log(req.cookies)
//   var pricing = []


//   request.query(`select count(*) as count from  dealers_prices_index a inner join cps_products b on b.id = a.productid  inner join cps_bigcomm_app_products cba on cba.sku = b.warrantycode where dealerid = (select dealerid from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}')  and cba.bc_store_id = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}') `,
//   (err, recordset) => {
//       if (err) {
//           console.log(err)
//       } else {
//         resultTotalCount = recordset.recordset[0].count
//         console.log("resultTotalCount" + resultTotalCount) 
        
        

//         var t = resultTotalCount / resultPerPage;
//         if(t * resultPerPage < resultTotalCount){
//             t += 1
//         }
            
//         restultTotalPages = Math.ceil(t)
//         console.log("restultTotalPages: " + restultTotalPages)





//         var sql = `	select cba.sku as sku, a.price as cost, cba.item_id, b.msrp as msrp, cba.price as dealer_price, cba.product_title as productitle from dealers_prices_index a inner join cps_products b on b.id = a.productid  inner join cps_bigcomm_app_products cba on cba.sku = b.warrantycode where dealerid = (select dealerid from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}') and cba.bc_store_id = (select bc_store_id from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash}') order by a.id desc  `
//   sql += " OFFSET " + (page - 1) * resultPerPage + " ROWS FETCH NEXT " + resultPerPage + " ROWS ONLY"
//   console.log(sql)
//   request.query(sql,
//   (err, recordset) => {
//       if (err) {
//           console.log(err)
//       } else {
//           var fromCount = 0 
//           if(page == 1){
//             fromCount = 1
//           }else{
//             fromCount = ((page - 1) * resultPerPage)
//           }

//         var toCount = 0 

//         if(page == restultTotalPages){
//             toCount = resultTotalCount
//           } else if(page == 1){
//             toCount = resultPerPage
//           }else{
//             toCount = (((page - 1) * resultPerPage) + resultPerPage)
//           }
          


//           pricing = recordset.recordset
//           res.render('pricing', {
//               title: 'Express',
//               selection: req.query.selection,
//               perpage: resultPerPage,
//               totalcount: resultTotalCount,
//               fromCount,
//               toCount,
//               pricing,
//               pagination: {
//                 page,
//                 pageCount: restultTotalPages
//               }
//           });
//       }
//   });

//       }
//   });


  
  
  });

/* GET settings page. */
router.get('/settings', function(req, res, next) {
    console.log(req.cookies)
  request.query("select * from cps_bigcommerce_app_installs where store_hash = '" + req.query.storehash + "'",
  (err, recordset) => {
      if (err) {
          console.log(err)
      } else {
          details = recordset.recordset[0]
          res.render('settings', { details, selection: req.query.selection });
      }
  });
});

/* GET profile page. */
router.get('/profile', function(req, res, next) {
   
    console.log(req.cookies)
  request.query("select * from cps_bigcommerce_app_installs where store_hash = '" + req.query.storehash + "'",
  (err, recordset) => {
      if (err) {
          console.log(err)
      } else {
          
        var contacts = []
        var dealerinfo = []
        var reps = []
        request.query(`select top 1 cdc.name as title, concat(firstname, ' ', lastname) as name, a.phone, a.email  from cps_dealers_contacts a inner join dealers_contact_types cdc on cdc.id = a.contacttypeid where dealerid =  (select dealerid from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash }') order by a.date_added desc `,
        (err, recordset) => {
            if (err) {
                console.log(err)
            } else {
              contacts = recordset.recordset[0]
                console.log(contacts)


                request.query(`select cba.domain,  a.id, DEALER_PHONE, DEALER_ADDRESS1, DEALER_STATE, DEALER_COUNTRY, DEALER_ZIP, DEALER_CITY, DEALER_FAX from cps_dealers a
				inner join cps_bigcommerce_app_installs cba on cba.dealerid = a.id
				where a.id = (select dealerid from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash }') 	and cba.store_hash = '${req.query.storehash }' `,
                (err, recordset) => {
                    if (err) {
                        console.log(err)
                    } else {

                        dealerinfo = recordset.recordset[0]
                        console.log(dealerinfo)

                        request.query(`	SELECT cps_admins_DEALERS.adminid,cps_admins.admin_name, cps_admins.direct_dial, cps_admins.phone_extension, cps_admins.EMAIL 
                        FROM cps_admins_dealers WITH (NOLOCK) 
                        INNER JOIN cps_admins WITH (NOLOCK) ON cps_admins_DEALERS.ADMINID = cps_admins.ID 
                        WHERE cps_admins_DEALERS.del_status = 0 
                           AND cps_admins.INVISIBLE = 0 
                            AND cps_admins.id <> 50 
                            AND cps_admins_DEALERS.dealerid = (select dealerid from cps_bigcommerce_app_installs where store_hash = '${req.query.storehash }')
                            AND cps_admins.status = 1 `,
                        (err, recordset) => {
                            if (err) {
                                console.log(err)
                            } else {
                                reps = recordset.recordset
                                console.log(reps)
                                res.render('profile', { contacts, dealerinfo, reps, selection: req.query.selection,storeHash:req.query.storehash,appUrl:req.query.appurl });
                            }
                        });
                        
                    }
                });



                
            }
        });

   
         
      }
  });
});


router.post("/onboard", (req, res) => {
    console.log(req.cookies)
    var storeHash = req.query.storehash
    request.query("update cps_bigcommerce_app_installs set company= '" + req.body.cname + "', first_name = '" + req.body.fname + "', last_name = '" + req.body.lname + "', phone = '" + req.body.phone + "', taxid = '" + req.body.taxid + "', admin_email = '" + req.body.email + "', address1 = '" + req.body.address1 + "', city = '" + req.body.city + "', state = '" + req.body.state + "', zip = '" + req.body.zip + "', onboardstatus = 1 where store_hash = '" + storeHash + "'", (err, recordset) => {	
        if (err) {
            console.log(err)           
        }else{
            var api_key = MAILGUN_API_KEY;   
            var from_who = 'noreply@cpscentral.com';
            var html = `BigCommerce Merchant filled out onboarding form. View it here: <a href="https://app.cpscentral.com/admside/checklist.aspx?view=206&onboard_status=1">https://app.cpscentral.com/admside/checklist.aspx?view=206&onboard_status=1</a>`
            var dataMail = {
                  from: 'noreply@cpscentral.com',
                  to: 'trubin@cpscentral.com;jheffez@cpscentral.com', 
                  subject: 'New Bigcomm App Onboard Form Filled Out',
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
    });
    res.redirect("/home?selection=home&newinstall=1")
})


router.post( "/updateSettings", (req, res) => {
    console.log(req.cookies)
    console.log(req.body)

    
    var touch_point = ""
    var result = ""

  

    if(req.body.action == "product_live"){
        touch_point = "Product Page"
    }else{
        touch_point = "Jump Page"
    }

    if(req.body.actionResult == true){
        result = "On"
    }else{
        result = "Off"
    }
  


    request.query("update cps_bigcommerce_app_installs set " + req.body.action + " = '" + req.body.actionResult + "' where store_hash = '" + req.query.storehash + "'", (err, recordset) => {
        if (err) {
            console.log(err)
        } else {



            request.query(`select cd.dealer_name as dealername, * from cps_bigcommerce_app_installs a inner join cps_dealers cd on cd.id = a.dealerid where a.store_hash = '${req.query.storehash }'`, (err, recordset) => {	
                if (err) {
                    console.log(err)           
                }else{
                    if(recordset.recordset.length > 0){
                    var d = new Date(); /* midnight in China on April 13th */
               var time = d.toLocaleString('en-US', { timeZone: 'America/New_York' });
                    var api_key = MAILGUN_API_KEY;   
                    var from_who = 'noreply@cpscentral.com';
                    var html = `Dealer ID: ${recordset.recordset[0].dealerid} <br /> Link: <a href="https://app.cpscentral.com/admside/dealer.aspx?dealerid=${recordset.recordset[0].dealerid}">https://app.cpscentral.com/admside/dealer.aspx?dealerid=${recordset.recordset[0].dealerid}</a> <br/> Dealer Name: ${recordset.recordset[0].dealername} <br /> Website: ${recordset.recordset[0].domain} <br /> Touchpoint: ${touch_point}. <br /> Result: ${result} <br /> Date/time of change. ${time} `
                    console.log(html)
                            var dataMail = {
                                from: 'noreply@cpscentral.com',
                                to: 'trubin@cpscentral.com,jheffez@cpscentral.com', 
                                subject: `${recordset.recordset[0].dealerid} - ${recordset.recordset[0].dealername} - ${touch_point}`,
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

    res.json({ status: 'Success' })
})



router.post("/updateSettings2", (req, res) => {
    console.log(req.cookies)
    console.log(req.body)


    request.query("select border_px, color, font_family,  offering_type, border_selected_px from cps_bigcommerce_app_installs  where store_hash = '" + req.query.storehash + "'", (err, recordset) => {
        if (err) {
            console.log(err)
        } else {
            if (recordset.recordset.length > 0) {
                var oldPx =  recordset.recordset[0].border_px
                var oldColor = recordset.recordset[0].color
                var oldFont = recordset.recordset[0].font_family
                var oldOffering = recordset.recordset[0].offering_type
                var oldBorderWidth = recordset.recordset[0].border_selected_px

                console.log(oldPx, req.body.border_px)
                console.log(oldColor, req.body.color)
                console.log(oldFont, req.body.font_family)
                console.log(oldOffering, req.body.offering_type)
                console.log(oldBorderWidth, req.body.border_selected_px)
                if(Number(req.body.border_px) !== oldPx){
                    request.query("insert into bigcomm_app_action_history(date_added,store_hash,action,value,old_value)values(getdate(), '" + req.query.storehash + "',  'border_px', " + req.body.border_px + ", " + oldPx + ")", (err, recordset) => {
                        if (err) {
                            console.log(err)
                        } else {

                        }
                    })
                }

                if(req.body.color !== oldColor){
                    request.query("insert into bigcomm_app_action_history(date_added,store_hash,action,value,old_value)values(getdate(), '" + req.query.storehash + "',  'color', '" + req.body.color + "', '" + oldColor + "')", (err, recordset) => {
                        if (err) {
                            console.log(err)
                        } else {

                        }
                    })
                }

                if(req.body.font_family !== oldFont){
                    request.query("insert into bigcomm_app_action_history(date_added,store_hash,action,value,old_value)values(getdate(), '" + req.query.storehash + "',  'font_family', '" + req.body.font_family + "', '" + oldFont + "')", (err, recordset) => {
                        if (err) {
                            console.log(err)
                        } else {

                        }
                    })
                }

                if(Number(req.body.offering_type) !== oldOffering){
                    request.query("insert into bigcomm_app_action_history(date_added,store_hash,action,value,old_value)values(getdate(), '" + req.query.storehash + "',  'offering_type', " + req.body.offering_type + ", " + oldOffering + ")", (err, recordset) => {
                        if (err) {
                            console.log(err)
                        } else {

                        }
                    })
                }

                if(Number(req.body.border_selected_px) !== oldBorderWidth){
                    request.query("insert into bigcomm_app_action_history(date_added,store_hash,action,value,old_value)values(getdate(), '" + req.query.storehash + "',  'border_selected_px', " + req.body.border_selected_px + ", " + oldBorderWidth + ")", (err, recordset) => {
                        if (err) {
                            console.log(err)
                        } else {

                        }
                    })
                }

            }
        }
    });



    request.query("update cps_bigcommerce_app_installs set border_px = '" + req.body.border_px + "', color = '" + req.body.color + "', font_family = '" + req.body.font_family + "', offering_type = '" + req.body.offering_type + "', border_selected_px = '" + req.body.border_selected_px + "' where store_hash = '" + req.query.storehash + "'", (err, recordset) => {
        if (err) {
            console.log(err)
        } else {

        }
    });

    res.json({ status: 'Success' })

  
})



//webhooks

/*  Product webhook. */
router.post('/webhooks/products/create', function(req, res, next) {
    res.status(200).send('OK')
  console.log(req.body)
  console.log("here product webhook")
  const { store_id, producer, scope } = req.body
  const { id } = req.body.data

  request.query("select * from cps_bigcommerce_app_installs where bc_store_id = " + store_id, (err, recordset) => {
    if (err) {
        console.log(err)
    } else {
        if (recordset.recordset.length > 0) {
            var accessToken = recordset.recordset[0].access_token
            var storeHash = recordset.recordset[0].store_hash

            const bigCommerce = new BigCommerce({
                clientId: CLIENT_ID,
                accessToken,
                storeHash,
                responseType: 'json',
                apiVersion: 'v3'
            });

           

            bigCommerce.get(`/catalog/products/${id}`)
            .then(data => {
                var categories = 0
                var categoriesName = ""
                if (data.data.categories.length > 0) {
                    bigCommerce.get('/catalog/categories/' + data.data.categories[0])
                    .then(category => {
                      categoriesName = category.data.name
                      syncProd()
                    })
                    .catch((data) => {
                        syncProd()
                    })
                    categories = data.data.categories.join(",")
                  
                }else{
                    syncProd()
                }

                function syncProd(){
                if (scope == "store/product/updated") {
                    if(categoriesName == null || categoriesName == "undefined"){
                        categoriesName = ""
                    }
                    request.query("update cps_bigcomm_app_products set categoryname = '" + categoriesName + "', categories = '" + categories + "', price =  " + data.data.price + ", sku = '" + data.data.sku + "', product_title = '" + data.data.name + "' where variant_id = 0 and item_id = " + data.data.id + " and storename = '" + producer + "'", (err, recordset) => {
                        if (err) {
                            console.log(err)
                        } else {
                            request.query("update cps_bigcomm_app_products set categoryname = '" + categoriesName + "', categories = '" + categories + "', product_title = '" + data.data.name + "' where  item_id = " + data.data.id + " and storename = '" + producer + "'", (err, recordset) => {
                                if (err) {
                                    console.log(err)
                                } else {

                                }
                            });
                        }
                    });
                } else if (scope == "store/product/created") {
                    if(categoriesName == null || categoriesName == "undefined"){
                        categoriesName = ""
                    }
                    request.query("insert into cps_bigcomm_app_products(dateadded,storename,warrantable,item_id,price,sku,product_title,product_Type,variant_id,bc_store_id,categories,image_url,categoryname)values(getdate(), '" + producer + "', 0, " + data.data.id + ", " + data.data.price + ", '" + data.data.sku + "', '" + data.data.name + "', '" + data.data.type + "', 0, " + store_id + ", '" + categories + "', '', '" + categoriesName + "')", (err, recordset) => {
                        if (err) {
                            console.log(err)
                        } else {
                            bigCommerce.get(`/catalog/products/${id}/images`)
                            .then(json => {
                                if(json.data.length == 0){
                                    request.query("update cps_bigcomm_app_products set image_url = 'https://s3.amazonaws.com/cdn.cpscentral.com/images/blank.png' where storename = '" + producer + "' and item_id = " + id, (err, recordset) => {
                                        if (err) {
                                            console.log(err)
                                        } else {
                            
                                        }
                                    });
                                }
                                json.data.forEach((productImage) => {
                                    var imageurl1 = ""
                                    if (productImage.url_thumbnail !== null && productImage.url_thumbnail.length > 0) {
                                        imageurl1 = productImage.url_thumbnail
                                    } else {
                                        imageurl1 = "https://s3.amazonaws.com/cdn.cpscentral.com/images/blank.png"
                                    }
                                    request.query("update cps_bigcomm_app_products set image_url = '" + imageurl1 + "' where storename = '" + producer + "' and item_id = " + productImage.product_id, (err, recordset) => {
                                        if (err) {
                                            console.log(err)
                                        } else {

                                        }
                                    });
                                })
                            })
                            .catch((data) => {})
                        }
                    });
                }
            }
            })
            .catch((data) => {
                console.log("deleted")
                 if (scope == "store/product/deleted") {
                    console.log("deleteedd")
                    request.query("delete from cps_bigcomm_app_products  where item_id = " + id + " and variant_id = 0 and storename = '" + producer + "'", (err, recordset) => {
                        if (err) {
                            console.log(err)
                        } else {
                        }
                    });
                } 
            })
        }
    }
});
 
  


});

/*  order webhook. */
router.post('/webhooks/orders/create', function(req, res, next) {
    res.status(200).send('OK')
    console.log("here order webhook")
    console.log(req.body)
    var ContainsWarrantyInOrder = 0
    var copyLineItems;
    var dealerid;
    var domain;
    const {
        created_at,
        store_id,
        producer,
        scope,
        hash
    } = req.body
    console.log("Scope: " + scope)
    const {
        id
    } = req.body.data




    request.query("select * from cps_bigcommerce_app_installs where bc_store_id = " + store_id, (err, recordset) => {
        if (err) {
            console.log(err)
        } else {
            if (recordset.recordset.length > 0) {
                var accessToken = recordset.recordset[0].access_token
                var storeHash = recordset.recordset[0].store_hash
                dealerid = recordset.recordset[0].dealerid
                domain = recordset.recordset[0].domain

                const bigCommerce = new BigCommerce({
                    clientId: CLIENT_ID,
                    accessToken,
                    storeHash,
                    responseType: 'json'
                });

                if (scope == "store/order/created" || scope == "store/order/statusUpdated") {
                    bigCommerce.get('/orders/' + id)
                        .then(data => {
                            if(data.status == "Shipped" || data.status == "Partially Shipped" || data.status == "Awaiting Pickup" || data.status == "Completed"){





                            request.query("select * from cps_bigcomm_app_orders where bigcom_orderid = " + id + "  and storeid = " + store_id, (err, recordset) => {
                                if (err) {
                                    console.log(err)
                                } else {
                                    if (recordset.recordset.length == 0) {
                                        


                            request.query("insert into cps_bigcomm_app_orders(dateadded,storename,storeid,bigcom_orderid,total,items_total,ip_address,currency_code,cart_id,bigcom_customerid,contains_warranty)values(getdate(), '" + producer + "', " + store_id + ", " + data.id + ", " + data.subtotal_ex_tax + ", " + data.items_total + ", '" + data.ip_address + "', '" + data.currency_code + "', '" + data.cart_id + "', " + data.customer_id + ", 0)", (err, recordset) => {
                                if (err) {
                                    console.log(err)
                                } else {

                                }
                            });


                            bigCommerce.get('/customers/' + data.customer_id)
                                .then(data => {
                                    fetch(data.addresses.url, {
                                            method: "GET",
                                            headers: {
                                                "X-Auth-Token": accessToken,
                                                "Content-type": "application/json",
                                                'Accept': 'application/json'
                                            }
                                        })
                                        .then(res => res.json())
                                        .then(json => {
                                            json.forEach((customerAddress) => {
                                                request.query("select * from cps_bigcomm_app_customers where store_id = '" + store_id + "' and bigcom_address_id = " + customerAddress.id + " and  bigcom_customerid = " + data.id, (err, recordset) => {	
                                                    if (err) {
                                                    }else{
                                                        if (recordset.recordset.length == 0) {
                                                            request.query("insert into cps_bigcomm_app_customers(bigcom_customerid,company,fname,lname,email,phone,address,city,state,zip,country,store_id,bigcom_address_id)values(" + data.id + ", '" + data.company + "', '" + data.first_name + "', '" + data.last_name + "', '" + data.email + "', '" + data.phone + "', '" + customerAddress.street_1 + "', '" + customerAddress.city + "', '" + customerAddress.state + "', '" + customerAddress.zip + "', '" + customerAddress.country + "', " + store_id + ", " + customerAddress.id + ")", (err, recordset) => {
                                                                if (err) {
                                                                    console.log(err)
                                                                } else {
            
                                                                }
                                                            });
                                                        }
                                                    }	            
                                                });  
                                            })
                                        })
                                        .catch((data) => {})
                                })




                            fetch(data.products.url, {
                                    method: "GET",
                                    headers: {
                                        "X-Auth-Token": accessToken,
                                        "Content-type": "application/json",
                                        'Accept': 'application/json'
                                    }
                                })
                                .then(res => res.json())
                                .then(json => {
                                    copyLineItems = json
                                    json.forEach((orderProduct, i) => {
                                        var isWarranty = 0
                                        request.query(`select * from cps_products where warrantycode = '${orderProduct.sku}'`, (err, recordset) => {	
                                            if (err) {
                                            }else{
                                                if (recordset.recordset.length > 0) {
                                                    isWarranty = 1
                                                    ContainsWarrantyInOrder = 1
                                                    request.query("update cps_bigcomm_app_orders set contains_warranty = 1 where storename = '" + producer + "' and bigcom_orderid = " + orderProduct.order_id , (err, recordset) => {
                                                        if (err) {
                                                            console.log(err)
                                                        } else {
            
                                                        }
                                                    });

                                                    request.query("insert into cps_bigcomm_app_orders_items(dateadded,storename,storeid,bigcom_orderid,price,sku,is_warranty,quantity,processed,cps_order_id,bigcom_productid)values(GETDATE(), '" + producer + "', " + store_id + ", " + orderProduct.order_id + ", " + orderProduct.price_ex_tax + ", '" + orderProduct.sku + "', 1, " + orderProduct.quantity + ",0,0, " + orderProduct.product_id + ")", (err, recordset) => {
                                                        if (err) {
                                                            console.log(err)
                                                        } else {
            
                                                        }
                                                    });
                                                }else{
                                                    ContainsWarrantyInOrder = 0
                                                    request.query("insert into cps_bigcomm_app_orders_items(dateadded,storename,storeid,bigcom_orderid,price,sku,is_warranty,quantity,processed,cps_order_id,bigcom_productid)values(GETDATE(), '" + producer + "', " + store_id + ", " + orderProduct.order_id + ", " + orderProduct.price_ex_tax + ", '" + orderProduct.sku + "', 0, " + orderProduct.quantity + ",0,0, " + orderProduct.product_id + ")", (err, recordset) => {
                                                        if (err) {
                                                            console.log(err)
                                                        } else {
                                                            if(i == json.length - 1 && ContainsWarrantyInOrder == 0){
                                                                aftermarket()
                                                            }
                                                        }
                                                    });
                                                }
                                            }	            
                                        });                                      
                                    })
                                })
                                .catch(() => {

                                })
                                    }
                                }
                         });
                            }else{
                                console.log(data.status)
                            }
                        })
                }




                function aftermarket(){
                    console.log("in aftermarket")
                    var customer_email = ""
                    var imageUrl = ""
                    fetch("https://api.bigcommerce.com/stores/" + storeHash + "/v2/orders/" + id + "/shipping_addresses", {
                        method: "GET",
                        headers: {
                            "X-Auth-Token": accessToken,
                            "Content-type": "application/json",
                            'Accept': 'application/json'
                        }
                    })
                    .then(res => res.json())
                    .then(json => {
                        customer_email = json[0].email
                        syncAfterMarket()
                    })
                    function syncAfterMarket(){
                    if(ContainsWarrantyInOrder == 0){
                        console.log(customer_email)
                        copyLineItems.forEach((orderProduct) => {
                                    request.query(`insert into cps_aftermarket_sale(origin,itemid,price,date_sold,buyer_email,transactionid,date_firstemail,date_added,status_campaign,date_last_activity,date_next_activity,dealer_id,attempts,sku,warrantable,category,phone,name,dop,model,coupon,product_title,product_image,domain)values(2, '${orderProduct.product_id}', '${orderProduct.price_ex_tax}', getdate(), '${customer_email}', '${orderProduct.order_id}', '1/1/1900', getdate(), 0, '1/1/1900', '1/1/1900', ${dealerid}, 0, '${orderProduct.sku}', 0, '', '', '${orderProduct.name}', '1/1/1900', '', 0,  '${orderProduct.name}', '${imageUrl}', '${domain}')`, (err, recordset) => {
                                        if (err) {
                                            console.log(err)
                                        } else {

                                        }
                                    });
                        })
                    }
                }
                }



            }
        }
 });
 
});



/*  sku webhook. */
router.post('/webhooks/sku/create', function(req, res, next) {
    res.status(200).send('OK')
    console.log("here sku webhook")
    console.log(req.body)

    const {
        created_at,
        store_id,
        producer,
        scope,
        hash
    } = req.body
    const {
        product_id
    } = req.body.data.sku

    request.query("select * from cps_bigcommerce_app_installs where bc_store_id = " + store_id, (err, recordset) => {
        if (err) {
            console.log(err)
        } else {
            if (recordset.recordset.length > 0) {
                var accessToken = recordset.recordset[0].access_token
                var storeHash = recordset.recordset[0].store_hash

                const bigCommerce = new BigCommerce({
                    clientId: CLIENT_ID,
                    accessToken,
                    storeHash,
                    responseType: 'json',
                    apiVersion: 'v3'
                });

                var productName = ''
                var productType = ''
                var categories = 0
                var categoriesName = ""


                bigCommerce.get(`/catalog/products/${product_id}`)
                    .then(json2 => {
                        productName = json2.data.name
                        productType = json2.data.type
                        if (json2.data.categories.length > 0) {
                            categories = json2.data.categories.join(",")
                            bigCommerce.get('/catalog/categories/' + json2.data.categories[0])
                            .then(data => {
                              categoriesName = data.data.name
                              syncProd()
                            })
                            .catch((data) => {
                                syncProd()
                            })
                        }else{
                            syncProd()
                        }
                        function syncProd(){
                        bigCommerce.get(`/catalog/products/${product_id}/variants/${req.body.data.sku.variant_id}`)
                            .then(json => {
                                console.log(json)
                                if (scope == "store/sku/updated") {
                                    var variantprice = json.data.price

                                    if(json.data.price== "undefined" || json.data.price == "null"  || json.data.price == null  || json.data.price == 0 ){
                                        variantprice = json2.data.price
                                    }
                                    if(categoriesName == null || categoriesName == "undefined"){
                                        categoriesName = ""
                                    }
                                    request.query("update cps_bigcomm_app_products set categoryname = '" + categoriesName + "', price =  " + variantprice + ", sku = '" + json.data.sku + "' where storename = '" + producer + "' and variant_id = " + json.data.id + " and item_id = " + json.data.product_id, (err, recordset) => {
                                        if (err) {
                                            console.log(err)
                                        } else {

                                        }
                                    });
                                } else if (scope == "store/sku/created") {

                                    request.query("select * from cps_bigcomm_app_products where storename = '" + producer + "' and  variant_id = " + json.data.id + " and item_id  = " + json.data.product_id, (err, recordset) => {
                                        if (err) {} else {
                                            if (recordset.recordset.length == 0) {
                                                var variantprice = json.data.price

                                                if(json.data.price== "undefined" || json.data.price == "null"  || json.data.price == null  || json.data.price == 0 ){
                                                    variantprice = json2.data.price
                                                }
                                                if(categoriesName == null || categoriesName == "undefined"){
                                                    categoriesName = ""
                                                }
                                                request.query("insert into cps_bigcomm_app_products(dateadded,storename,warrantable,item_id,price,sku,product_title,product_Type,variant_id,bc_store_id,categories,image_url, categoryname)values(getdate(), '" + producer + "', 0, " + json.data.product_id + ", " + variantprice + ", '" + json.data.sku + "', '" + productName + "', '" + productType + "', " + json.data.id + ", " + store_id + ", '" + categories + "', '', '" + categoriesName + "')", (err, recordset) => {
                                                    if (err) {
                                                        console.log(err)
                                                    } else {
                                                        bigCommerce.get(`/catalog/products/${json.data.product_id}/images`)
                                                        .then(json => {
                                                            if(json.data.length == 0){
                                                                request.query("update cps_bigcomm_app_products set image_url = 'https://s3.amazonaws.com/cdn.cpscentral.com/images/blank.png' where variant_id = '" +  req.body.data.sku.variant_id + "' and storename = '" + producer + "' and item_id = " + product_id, (err, recordset) => {
                                                                    if (err) {
                                                                        console.log(err)
                                                                    } else {
                                                        
                                                                    }
                                                                });
                                                            }
                                                            json.data.forEach((productImage) => {
                                                                var imageurl1 = ""
                                                                if (productImage.url_thumbnail !== null && productImage.url_thumbnail.length > 0) {
                                                                    imageurl1 = productImage.url_thumbnail
                                                                } else {
                                                                    imageurl1 = "https://s3.amazonaws.com/cdn.cpscentral.com/images/blank.png"
                                                                }
                                                                request.query("update cps_bigcomm_app_products set image_url = '" + imageurl1 + "' where variant_id = '" +  req.body.data.sku.variant_id + "' and storename = '" + producer + "' and item_id = " + product_id, (err, recordset) => {
                                                                    if (err) {
                                                                        console.log(err)
                                                                    } else {
                        
                                                                    }
                                                                });
                                                            })
                                                        })
                                                        .catch((data) => {})
                                                        


                                                    }
                                                });
                                            }
                                        }
                                    });


                                }

                            })
                            .catch(() => {
                                console.log("deleted sku")
                                if (scope == "store/sku/deleted") {
                                   request.query("delete from cps_bigcomm_app_products  where item_id = " + product_id + " and variant_id = " + req.body.data.sku.variant_id + " and storename = '" + producer + "'", (err, recordset) => {
                                       if (err) {
                                           console.log(err)
                                       } else {
                                       }
                                   });
                               }
                            })
                        }
                    })
                    .catch((data) => {
                        console.log("deleted sku")
                                if (scope == "store/sku/deleted") {
                                   request.query("delete from cps_bigcomm_app_products  where item_id = " + product_id + " and variant_id = " + req.body.data.sku.variant_id + " and storename = '" + producer + "'", (err, recordset) => {
                                       if (err) {
                                           console.log(err)
                                       } else {
                                       }
                                   });
                               }
                    })
            }
        }
    });


    
});
module.exports = router;
