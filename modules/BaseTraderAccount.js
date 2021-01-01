var fs = require('fs');
var fetch = require("node-fetch");
var _ = require("lodash");
var dayjs = require("dayjs");
class BaseTraderAccounts {
    baseUrl = "https://busstrade.com/api/";
    referrerUrl = "https://busstrade.com/dashboard";
    expertSessionTime = 3600;
    historyDelayTime = 5;
    options = {};
    constructor(options) {
        this.options = options;
    }

    loadCookies() {
        return JSON.parse(fs.readFileSync("/data/app/assets/bussTrade-nkien.bk@gmail.com.json"));
    }

    async getToken() {
        return await this.loadCookies().token;
    }

    async getXsrfToken() {
        return await this.loadCookies()['XSRF-TOKEN'];
    }

    getRawCookies(cookies) {
        var rawCookies = "";
        Object.keys(cookies).forEach(name => {
            var value = cookies[name];
            if (rawCookies.length != 0) {
                rawCookies += " ";
            }
            rawCookies += name + "=" + value + ";";
        });
        return rawCookies;
    }
    async request(method, path, data) {
        var cookies = this.loadCookies();
        var url = this.baseUrl + path;
        return new Promise(async (resolve, reject) => {
            fetch(url, {
                "headers": {
                    "accept": "application/json, text/plain, */*",
                    "accept-language": "en-US,en;q=0.9,vi;q=0.8,fr;q=0.7",
                    "authorization": "Bearer " + cookies['token'],
                    "content-type": "application/json;charset=UTF-8",
                    "sec-ch-ua": "\"Google Chrome\";v=\"87\", \" Not;A Brand\";v=\"99\", \"Chromium\";v=\"87\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-requested-with": "XMLHttpRequest",
                    "x-xsrf-token": cookies['XSRF-TOKEN'],
                    "cookie": this.getRawCookies(cookies),
                },
                "referrer": this.referrerUrl,
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": JSON.stringify(data),
                "method": method,
                "mode": "cors"
            }).then(res => {
                resolve(res.json())
            }).catch(error => {
                reject(error);
            })
        })
    }

    apiGet(path, data) {
        return this.request("GET", path, data);
    }
    apiPost(path, data) {
        return this.request("POST", path, data);
    }

    async getDemoHistory() {
        return await this.apiGet("histories/demo?page=1");
    }

    async getExpertHistory() {
        return await this.apiGet("histories/copytrade?page=1");
    }

    async getExpertPendingOrder(demo = false) {
        return new Promise(async (resolve, reject) => {
            var historyResult;
            if (demo) {
                historyResult = await this.getDemoHistory();
            } else {
                historyResult = await this.getExpertHistory();
            }
            var orders = historyResult.data.orders.data;
            var pendingOrder = this.getPendingOrderFromHistory(orders);
            resolve(pendingOrder);
        })
    }

    getNumberOrderOfCurrentSession(orders) {
        return this.filterCurrentSessionOrders(orders).length;
    }

    filterCurrentSessionOrders(orders) {
        var results = [];
        var currentTime = dayjs().unix();
        _.forEach(orders, (order) => {
            var orderTimeString = order.created_at;
            var orderTimeStamp = dayjs(orderTimeString).unix();
            if ((currentTime - orderTimeStamp) < this.expertSessionTime) {
                results.push(order);
            }
        })
        return results;
    }

    listenPendingOrder(callback, demo = false) {
        var isCheckingHistory;
        setInterval(async() => {
            var currentSecond = dayjs().format("s");
            if (!isCheckingHistory && currentSecond > 21 && currentSecond < 30) {
                isCheckingHistory = true;
                console.time("getExpertPendingOrder");
                var pendingOrder = await this.getExpertPendingOrder(demo);
                console.timeEnd("getExpertPendingOrder");
                if (pendingOrder != null) {
                    callback(pendingOrder);
                    setTimeout(() => {
                        isCheckingHistory = false;
                    }, 15000)
                } else {
                    isCheckingHistory = false;
                }
            }
        }, 1000)
    }

    isEnableTobet(order) {
        var orderTimeString = order.created_at;
        var orderTimeStamp = dayjs(orderTimeString).unix();
        var currentTime = dayjs().unix();
        console.log("delta time", currentTime - orderTimeStamp, (currentTime - this.historyDelayTime) / 30, orderTimeStamp / 30);
        if (parseInt((currentTime - this.historyDelayTime) / 30) == parseInt(orderTimeStamp / 30)) {
            return true;
        } else {
            return false;
        }
    }

    getPendingOrderFromHistory(orders) {
        var orderNumber = this.getNumberOrderOfCurrentSession(orders);
        var lastestOder = orders[0];
        if (lastestOder.status != 0) {
            return null;
        } else {
            return {
                market: lastestOder.market_name,
                action: lastestOder.action,
                amount: lastestOder.amount,
                orderNumber: orderNumber,
                enableToBet: this.isEnableTobet(lastestOder)
            }
        }
    }

    async followExpert(callback, demo = false) {
        this.getExpertPendingOrder({

        }, demo)
    }

}


module.exports = BaseTraderAccounts;