/**
 * Created by ZTR on 6/10/16.
 */
(function() {
    var model = window.model;
    var db;
    var KEYS = ['items', 'folded', 'msg', 'filter'];

    Object.assign(model, {
        init: function(callback) {
            db = window.openDatabase(model.TOKEN, '0.0.1', model.TOKEN, 2 * 1024 * 1024); // create a db
            db.transaction(
                function(transaction) {
                    transaction.executeSql('CREATE TABLE IF NOT EXISTS ZTRTODO (k unique, v)');
                    KEYS.forEach(function(key) {
                        transaction.executeSql('INSERT INTO ZTRTODO (k, v) VALUES (?, ?)', [key, JSON.stringify(model.data[key])]);
                    });
                },
                null,
                function() {
                    if (callback) callback();
                }
            );

            db.transaction(
                function(transaction) {
                    KEYS.forEach(function(key) {
                        transaction.executeSql('SELECT v FROM ZTRTODO WHERE k=?', [key], function(t, r) {
                            model.data[key] = JSON.parse(r.rows[0].v);
                        });
                    });
                },
                null,
                function() {
                    if (callback) callback();
                }
            );
        },
        flush: function(callback) {
            db = window.openDatabase(model.TOKEN, '0.0.1', model.TOKEN, 2 * 1024 * 1024);
            db.transaction(
                function(transaction) {
                    KEYS.forEach(function(key) {
                        transaction.executeSql('UPDATE ZTRTODO SET v=? WHERE k=?', [JSON.stringify(model.data[key]), key]);
                    });
                },
                null,
                function() {
                    if (callback) callback();
                }
            );
        }
    });
})();
