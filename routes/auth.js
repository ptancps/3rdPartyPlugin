const express = require('express'),
router = express.Router(),
sql = require('mssql'),
BigCommerce = require('node-bigcommerce');
require('dotenv').config();
var fetch = require("node-fetch")

var Cookies = require('cookies')

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
var username = ""
var accessToken = ""
var storeName = ""
var storeId = 0
var store_hash = ""

const bigCommerce = new BigCommerce({
clientId: CLIENT_ID,
secret: SECRET,
callback: `${HOST}/auth`,
responseType: 'json'
});

router.get('/', (req, res, next) => {
   
bigCommerce.authorize(req.query)
.then(data => {
    console.log("Data: " + data)
    username = data.user.username
    accessToken = data.access_token
    storeName = data.context
    console.log("authorized " + username + ", " + accessToken + ", " + storeName)
    
     store_hash = (data.context.split("/")[1])

    

    request.query(`select * from cps_bigcommerce_app_installs where store = '${storeName}'`, (err, recordset) => {	
        if (err) {
            console.log(err)           
        }else{
            if (recordset.recordset.length == 0) {
                //for testing comment this out and set evrything to 1 with d5211 set


                //      request.query("insert into cps_bigcommerce_app_installs(store,access_token,date_added,email,bigcomm_userid,username,imported_products,imported_script,dealerid,registered_product_webhooks,registered_order_webhooks,product_live,annual_monthly,cart_live,offering_type,border_px,font_family,color,bc_store_id,currency,admin_email,domain,logo,phone,first_name,last_name,store_hash,status,jump_page,post_sale,onboardstatus,taxid,address1,city,state,zip,offer_monthly_and_annual)values('" +  data.context  + "', '" + data.access_token + "', getdate(), '" + data.user.email + "', " + data.user.id + ", '" + data.user.username + "', 1, 1, 5211, 0, 0, 1, 1, 0, 1, '', '', '#3b15c6', 0, '', '', '', '', '', '', '', '" + store_hash + "', 1, 0, 0, 0, '', '', '', '', '', 0)", (err, recordset) => {	
                //     if (err) {
                //         console.log(err)           
                //     }else{
                //         console.log("inseted")
                //     }	            
                // });
                
                request.query("insert into cps_bigcommerce_app_installs(store,access_token,date_added,email,bigcomm_userid,username,imported_products,imported_script,dealerid,registered_product_webhooks,registered_order_webhooks,product_live,annual_monthly,cart_live,offering_type,border_px,font_family,color,bc_store_id,currency,admin_email,domain,logo,phone,first_name,last_name,store_hash,status,jump_page,post_sale,onboardstatus,taxid,address1,city,state,zip,offer_monthly_and_annual,company,border_selected_px)values('" +  data.context  + "', '" + data.access_token + "', getdate(), '" + data.user.email + "', " + data.user.id + ", '" + data.user.username + "', 0, 0, 0, 0, 0, 1, 1, 0, 1, '', '', '#3b15c6', 0, '', '', '', '', '', '', '', '" + store_hash + "', 1, 0, 0, 0, '', '', '', '', '', 0, '', 0)", (err, recordset) => {	
                    if (err) {
                        console.log(err)           
                    }else{
                        console.log("inseted")
                    }	            
                });


                //set apiVerison: 'v3'
                const bigCommerce2 = new BigCommerce({
                    clientId: CLIENT_ID,
                    accessToken: data.access_token,
                    storeHash: store_hash,
                    responseType: 'json',
                    apiVersion: 'v3'
                  });

                  const bigCommerce4 = new BigCommerce({
                    clientId: CLIENT_ID,
                    accessToken: data.access_token,
                    storeHash: store_hash,
                    responseType: 'json'
                  });
            
                  var category = {
                    name: 'Consumer Priority Service',
                    is_visible: false,
                    parent_id: 0

                  }


                  bigCommerce2.post('/catalog/categories', category)
                  .then(data => {
                      console.log("added category")
                  // Catch any errors, data will be null
                  });
               


                  //get store info
                  bigCommerce4.get('/store')
      .then(data => {
          console.log("data2: " + data)
        storeId = data.store_id
        console.log("getting store info...storeid = " + storeId)
        
        request.query("update cps_bigcommerce_app_installs set admin_email = '" + data.admin_email + "', bc_store_id = " + data.store_id + ", currency = '" + data.currency + "' , domain = '" + data.domain + "' , logo = '" + data.logo.url + "' , phone = '" + data.phone + "' , first_name = '" + data.first_name + "' , last_name = '" + data.last_name + "' where store_hash = '" + data.id + "'",
                          (err, recordset) => {	
                              if (err) {
                                  console.log(err)	  
                              }else{
                                var api_key = MAILGUN_API_KEY;   
                                var from_who = 'noreply@cpscentral.com';
                        var html = `Name: ${data.first_name + " " + data.last_name} <br /> Email: ${data.admin_email} <br/> Website: ${data.domain} <br /> Phone: ${data.phone} <br /> View install here <a href="https://app.cpscentral.com/admside/checklist.aspx?view=206&onboard_status=0">https://app.cpscentral.com/admside/checklist.aspx?view=206&onboard_status=0</a>`
                        console.log(html)
                                var dataMail = {
                                      from: 'noreply@cpscentral.com',
                                      to: 'trubin@cpscentral.com', 
                                      subject: 'New Bigcomm App Install',
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

      //get categories                    
      bigCommerce2.get('/catalog/categories?limit=250')
      .then(data => {
          data.data.forEach((merchantCategory) => {
              request.query("insert into cps_bigcommerce_store_categories(store_id,storename,bc_categoryid,bc_category_name)values(" + storeId + ", '" + storeName + "', " + merchantCategory.id + ", '" + merchantCategory.name + "')", (err, recordset) => {	
                  if (err) {
                      console.log(err)           
                  }else{
                      console.log("inserted categories")
                  }	            
              });
          })
      })
     




      //for testing set everything to 100065
      //get products  
      //set limit = 250                  
      bigCommerce2.get('/catalog/products?limit=250')
      .then(data => {
          data.data.forEach((product) => {
              var categories = 0
              var categoriesName = ''
              if (product.categories.length > 0 ){
                  categories = product.categories.join(",")

                  bigCommerce2.get('/catalog/categories/' + product.categories[0])
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

           


            //   request.query("insert into cps_bigcomm_app_products(dateadded,storename,warrantable,item_id,price,sku,product_title,product_Type,variant_id,bc_store_id,categories,image_url)values(getdate(), '" + storeName + "', 100065, " + product.id + ", " + product.price + ", '" + product.sku + "', '" + product.name + "', '" + product.type + "', 0, " + storeId + ", '" + categories + "', '')", (err, recordset) => {	
            //           if (err) {
            //               console.log(err)           
            //           }else{
                          
            //           }	            
            //       });

              function syncProd(){
                if(categoriesName == null || categoriesName == "undefined"){
                    categoriesName = ""
                }
              request.query("insert into cps_bigcomm_app_products(dateadded,storename,warrantable,item_id,price,sku,product_title,product_Type,variant_id,bc_store_id,categories,image_url,categoryname)values(getdate(), '" + storeName + "', 0, " + product.id + ", " + product.price + ", '" + product.sku + "', '" + product.name + "', '" + product.type + "', 0, " + storeId + ", '" + categories + "', '', '" + categoriesName + "')", (err, recordset) => {	
                  if (err) {
                      console.log(err)           
                  }else{
                      
                  }	            
              });

              bigCommerce2.get(`/catalog/products/${product.id}/variants`)
              .then(json => {
                 
                  json.data.forEach((productVariant) => {
                    var variantprice = productVariant.price

                    if(productVariant.price == "undefined" || productVariant.price == "null"  || productVariant.price == null  || productVariant.price.length == 0 ){
                        variantprice = product.price
                    }
                    request.query("select * from cps_bigcomm_app_products where sku = '" + productVariant.sku + "' and item_id = '" + productVariant.product_id + "' and storename = '" + storeName  + "'", (err, recordset) => {	
                        if (err) {
                            console.log(err)
                        }else{
                            if(recordset.recordset.length == 0){
                                // request.query("insert into cps_bigcomm_app_products(dateadded,storename,warrantable,item_id,price,sku,product_title,product_Type,variant_id,bc_store_id,categories,image_url)values(getdate(), '" + storeName + "', 100065, " + productVariant.product_id + ", " + variantprice + ", '" + productVariant.sku + "', '" + product.name + "', '" + product.type + "', " + productVariant.id + ", " + storeId + ", '" + categories + "', '')", (err, recordset) => {	
                                //     if (err) {
                                //         console.log(err)           
                                //     }else{
                                        
                                //     }	            
                                // });
                                if(categoriesName == null || categoriesName == "undefined"){
                                    categoriesName = ""
                                }
                            request.query("insert into cps_bigcomm_app_products(dateadded,storename,warrantable,item_id,price,sku,product_title,product_Type,variant_id,bc_store_id,categories,image_url,categoryname)values(getdate(), '" + storeName + "', 0, " + productVariant.product_id + ", " + variantprice + ", '" + productVariant.sku + "', '" + product.name + "', '" + product.type + "', " + productVariant.id + ", " + storeId + ", '" + categories + "', '', '" + categoriesName + "')", (err, recordset) => {	
                                if (err) {
                                    console.log(err)           
                                }else{
                                    
                                }	            
                            });
                            }
                        }
                    })
                  })

                  bigCommerce2.get(`/catalog/products/${product.id}/images`)
                                .then(json => {
                                    if(json.data.length == 0){
                                        request.query("update cps_bigcomm_app_products set image_url = 'https://s3.amazonaws.com/cdn.cpscentral.com/images/blank.png' where storename = '" + storeName + "' and item_id = " + product.id, (err, recordset) => {
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
                                        request.query("update cps_bigcomm_app_products set image_url = '" + imageurl1 + "' where storename = '" + storeName + "' and item_id = " + productImage.product_id, (err, recordset) => {
                                            if (err) {
                                                console.log(err)
                                            } else {

                                            }
                                        });
                                    })
                                })
                                .catch((data) => {})



              })
              .catch(() => {
                bigCommerce2.get(`/catalog/products/${product.id}/images`)
                .then(json => {
                    if(json.data.length == 0){
                        request.query("update cps_bigcomm_app_products set image_url = 'https://s3.amazonaws.com/cdn.cpscentral.com/images/blank.png' where storename = '" + storeName + "' and item_id = " + product.id, (err, recordset) => {
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
                        request.query("update cps_bigcomm_app_products set image_url = '" + imageurl1 + "' where storename = '" + storeName + "' and item_id = " + productImage.product_id, (err, recordset) => {
                            if (err) {
                                console.log(err)
                            } else {

                            }
                        });
                    })
                })
                .catch((data) => {})
              })  
            }             
          })// end for each product
      });  // end get products                  



    }); //end get store


            }else{
                request.query("update cps_bigcommerce_app_installs set access_token =  '" + data.access_token + "', imported_script = 0, registered_product_webhooks = 0, registered_order_webhooks = 0, onboardstatus =0, dealerid = 0, status = 1  where store = '" + storeName + "'", (err, recordset) => {	
                    if (err) {
                        console.log(err)           
                    }else{
                      
                    }	            
                });
            }
        }	            
    });
    

   
       
      
})//end authorize
.then(data =>  {
    console.log(store_hash)
    var firstname= ""
    var lastname = ""
    var email = ""
    var address = ""
    var phone = ""

    const bigCommerce3 = new BigCommerce({
        clientId: CLIENT_ID,
        accessToken: accessToken,
        storeHash: store_hash,
        responseType: 'json'
      });



      bigCommerce3.get('/store')
        .then(data => {
        console.log("data3s: " + data)
        firstname = data.first_name
        lastname = data.last_name
        email = data.admin_email
        address= data.address
        phone = data.phone
        storeId = data.store_id


        res.cookie('storehash', store_hash, { httpOnly: true, secure: true, sameSite: 'none' }); 
        res.render('onboard', { user: username, firstname, lastname, email, address, phone })

      })


});
});

module.exports = router;