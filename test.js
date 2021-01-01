BaseTraderAccount = require("./modules/BaseTraderAccount")
var test = new BaseTraderAccount();

var run = async  function () {
//    var result = await test.apiGet("profile/user");
//    var result  = await test.getExpertPendingOrder(true);
//    console.log(result);
    test.listenPendingOrder((order) => {
        console.log(order);
    }, true)
}

run();