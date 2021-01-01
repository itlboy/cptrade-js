var fs = require('fs');
var fetch = require("node-fetch");
class BaseTraderAccounts {
    baseUrl = "https://busstrade.com/api/";
    referrerUrl = "https://busstrade.com/dashboard";
    options = {};

    constructor(options) {
        this.options = options;
    }

    loadCookies() {
        return JSON.parse(fs.readFileSync("assets/busstrade/nkien.bk@gmail.com.json"));
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

        console.log(rawCookies);
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

    }

    async getExpertHistory() {

    }

    async getExpertPendingOrder(callback, demo = false) {
        var result;
        if (demo) {
            result = await this.getDemoHistory();
        } else {
            result = await this.getExpertHistory();
            callback();
    }
    }

    filterPendingOrder() {
        
    }

}


module.exports = BaseTraderAccounts;