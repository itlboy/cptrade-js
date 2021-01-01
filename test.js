BaseTraderAccount = require("./modules/BaseTraderAccount")
var test = new BaseTraderAccount();


var run = async  function () {
    var result = await test.apiGet("profile/user");
    console.log("heheh");
    console.log(result);
}

run();