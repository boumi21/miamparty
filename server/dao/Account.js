const database = require("../database/Database.js")
const password = require( "../assistant/Password.js")

const mysql = database.mysql;
const connection = database.connection;

function signIn(loginInfo, callback) {
    let checkEmail = 'SELECT * ' +
                     'FROM account ' +
                     'WHERE account.email = ' + mysql.escape(loginInfo.body.email);

    connection.query(checkEmail, function (err, result, fields) {
        if (err) {
            console.log(err)
            callback(err.sqlMessage, null);
        }
        else {
            console.log(result)
            if (result.length == 0 ) {
                console.log("res=0")
                callback("Votre identifiant ou mot de passe est incorrect.", null);
            }
            else if (password.hashString(loginInfo.body.password + result[0].salt) != result[0].password) {
                console.log("mauvais mdp")
                callback("Votre identifiant ou mot de passe est incorrect.", null);
            }
            else {
                callback(null, {
                    user: result[0]
                });
            }
        }
       
    })
}

//Récupère les informations de l'utilisateur pour un particulier ou un pro
function getUserInfo(user, callback){
    
    console.log("type "+ user.id_account_type)
    if(user.id_account_type == 1){

        let ressources = 
        'SELECT * ' +
        'FROM account ' +
        'INNER JOIN particular on account.id_account = particular.id_account '+
        'WHERE account.id_account = '+ user.id_account;
        connection.query(ressources, function (err, result) {
            
            if (err) {
                console.log(err)
                callback("Erreur dans la récupération des données du particulier", null);
            }
            else {
                
                callback(null, {
                    user: result[0]
                });          
            }           
        })
    }
    else if(user.id_account_type == 2){
        let ressources = 
        'SELECT * ' +
        'FROM account ' +
        'INNER JOIN professional on account.id_account = professional.id_account '+
        'WHERE account.id_account = '+ user.id_account;
        connection.query(ressources, function (err, result) {
            
            if (err) {
                console.log(err)
                callback("Erreur dans la récupération des données du professionnel", null);
            }
            else {
                
                callback(null, {
                    user: result[0]
                });          
            }           
        })
    }
}



function signUpPart(registerInfo, callback) {
    let checkEmail = 'SELECT * ' +
                     'FROM account ' +
                     'WHERE account.email = ' + mysql.escape(registerInfo.body.email)

    connection.query(checkEmail, function (err, result, fields) {
        if (err) {
            callback(err.sqlMessage, null);
        }
        else {
            if (result.length != 0 ) {
                callback("Cette adresse email est déjà utilisée.", null);
            }
            else {
                let getIdAccountType = 'SELECT * ' +
                                       'FROM account_type ' +
                                       'WHERE account_type.description = "Particulier"'

                connection.query(getIdAccountType, function (err, result, fields) {
                    if (err) {
                        callback(err.sqlMessage, null);
                    }
                    else {
                        console.log(result)
                        registerInfo.body.accountType = result[0].id_account_type
                        console.log(registerInfo.body.accountType)
                        let salt = password.getSalt(64)
                        let pw = password.hashString(registerInfo.body.password + salt)
                        let insertAccount = 'INSERT INTO account ' +
                                            '(id_account_type, email, password, salt) VALUES ?'
                        let value = [[registerInfo.body.accountType, registerInfo.body.email, pw, salt]]

                        connection.query(insertAccount, [value], function (err, result) {
                            if (err) {
                                console.log(err)
                                callback(err.sqlMessage, null);
                            }
                            else {
                                console.log(registerInfo.body.sex)
                                let insertParticular = 'INSERT INTO particular ' +
                                                       '(id_account, id_cooking_level, firstname, lastname, birthday, sex) VALUES ?'
                                let value = [[result.insertId, registerInfo.body.level, registerInfo.body.firstname, registerInfo.body.lastname, registerInfo.body.birth, registerInfo.body.sex]]

                                connection.query(insertParticular, [value], function (err, result) {
                                    if (err) {
                                        console.log(err)
                                        callback(err.sqlMessage, null);
                                    }
                                    else {
                                        console.log(result.insertId)
                                        callback(null, result.insertId)
                                    }
                            })
                            }
                        })
                    }

                })
            }
        }
       
    })
}

module.exports = {
    getUserInfo,
    signIn,
    signUpPart
}
