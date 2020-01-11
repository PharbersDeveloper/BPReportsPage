import Controller from '@ember/controller';
import { A } from '@ember/array';
import { inject as service } from '@ember/service';
import { all } from 'rsvp';
import { computed, observer } from '@ember/object';
import { isEmpty } from '@ember/utils';

export default Controller.extend({
    ajax: service(),
    qa: "http://192.168.100.174:3000/sql",

    propertiesObserver: observer("endDate", "prodName", function () {
        this.set("provName", "全国")
        this.set("cityName", "")
    }),
    provObserver: observer("provName", function () {
        this.set("cityName", "")
    }),
    endDateObserver: observer("endDate", function () {
        this.productQuery(this.endDate)
    }),
    productQuery(endDate) {
        const queryDimensionSql = "SELECT PRODUCT_NAME, AVG(EI) AS EI, " +
            "AVG(PROD_SALES_IN_COMPANY_VALUE) AS PROD_SALES_IN_COMPANY_VALUE, " +
            "AVG(PROD_SALES_IN_COMPANY_RANK) AS PROD_SALES_IN_COMPANY_RANK, " +
            "AVG(PROD_MOM) AS PROD_MOM FROM test2 WHERE COMPANY = " +
            "'Sankyo' AND YM = " + endDate + " GROUP BY COMPANY.keyword, " +
            "PRODUCT_NAME.keyword ORDER BY PROD_SALES_IN_COMPANY_RANK";

        return this.ajax.request(this.qa + '?tag=row2line&dimensionKeys=PRODUCT_NAME,EI,PROD_SALES_IN_COMPANY_VALUE,PROD_SALES_IN_COMPANY_RANK,PROD_MOM', {
            method: 'POST',
            data: JSON.stringify({ "sql": queryDimensionSql }),
            dataType: 'json'
        }).then(data => {
            let keys = data.slice(0, 1)[0]
            // ["PRODUCT_NAME", "EI", "PROD_SALES_IN_COMPANY_VALUE", "PROD_SALES_IN_COMPANY_RANK", "PROD_MOM"]
            return data.slice(1).map(ele => {

                return {
                    [keys[0]]: ele[0],
                    [keys[1]]: ele[1],
                    [keys[2]]: ele[2],
                    [keys[3]]: ele[3],
                    [keys[4]]: ele[4]
                }
            }).slice(0, 20)
        }).then(data => {
            this.set("productData", data)
            this.set("prodName", data[0]["PRODUCT_NAME"])
            this.set("curIndex", 0)
            return data
        })
    },
    curIndex: 0,
    prodName: "代文",
    startDate: "",
    endDate: "201906",
    provName: "全国",
    cityName: "",
    mss: A([]),
    mts: A([]),
    mcs: A([]),
    tableColumns: A([
        { name: "药品名", valuePath: "PRODUCT_NAME", isFixed: 'left', isSortable: false },
        { name: "市场规模(Mn)", valuePath: "MKT_SALES_VALUE", isSortable: true,cellComponent:"format-mn" },
        { name: "市场增长率", valuePath: "MKT_MOM", isSortable: true,cellComponent:"format-percentage"  },
        { name: "产品销售量(Mn)", valuePath: "PROD_SALES_VALUE", isSortable: true ,cellComponent:"format-mn" },
        { name: "产品市场份额", valuePath: "PROD_IN_CITY_SHARE", isSortable: true ,cellComponent:"format-percentage"},
        { name: "产品销售增长率", valuePath: "PROD_MOM", isSortable: true,cellComponent:"format-percentage" },
        { name: "EI", valuePath: "EI", isSortable: true,cellComponent: "format-decimal" }
    ]),
    tableData: computed("endDate", "prodName", "provName", "cityName", function () {
        let endDate = this.endDate,
            prodName = this.prodName,
            provSql = this.provName === "全国" ? "" : " AND PROVINCE_NAME = '" + this.provName + "'",
            citySql = this.cityName ? " AND CITY_NAME = '" + this.cityName + "'" : "",
            columns = [
                { name: "药品名", valuePath: "PRODUCT_NAME", isFixed: 'left', isSortable: false },
                { name: "市场规模(Mn)", valuePath: "MKT_SALES_VALUE", isSortable: true,cellComponent:"format-mn" },
                { name: "市场增长率", valuePath: "MKT_MOM", isSortable: true,cellComponent:"format-percentage"  },
                { name: "产品销售量(Mn)", valuePath: "PROD_SALES_VALUE", isSortable: true ,cellComponent:"format-mn"},
                { name: "产品销售增长率", valuePath: "PROD_MOM", isSortable: true,cellComponent:"format-percentage" },
                { name: "EI", valuePath: "EI", isSortable: true,cellComponent: "format-decimal" }
            ],
            rows = [],
            queryDimensionSql = "SELECT PRODUCT_NAME, AVG(MKT_SALES_VALUE) " +
                "AS MKT_SALES_VALUE, AVG(MKT_MOM) AS MKT_MOM, " +
                "AVG(PROD_SALES_VALUE) AS PROD_SALES_VALUE, " +
                "AVG(PROD_IN_CITY_SHARE) AS PROD_IN_CITY_SHARE, AVG(PROD_MOM) " +
                "AS PROD_MOM, AVG(EI) AS EI FROM test2 WHERE MKT IN " +
                "(SELECT MKT FROM test2 WHERE COMPANY = 'Sankyo' AND YM = " +
                endDate + " AND PRODUCT_NAME = '" + prodName +
                "') AND COMPANY = 'Sankyo' AND YM = " + endDate + provSql + citySql +
                " GROUP BY PRODUCT_NAME.keyword",
            reqBody = {
                "sql": queryDimensionSql
            }
        return this.ajax.request("http://192.168.100.174:3000/sql" + "?tag=row2line&dimensionKeys=PRODUCT_NAME,MKT_SALES_VALUE,MKT_MOM,PROD_SALES_VALUE,PROD_IN_CITY_SHARE,PROD_MOM,EI", {

            method: 'POST',
            data: JSON.stringify(reqBody),
            dataType: 'json'
        }).then(data => {
            let keys = data[0]
            let rowRawData = data.slice(1);
            rows = rowRawData.map(ele => {
                return {
                    [keys[0]]: ele[0],
                    [keys[1]]: ele[1],
                    [keys[2]]: ele[2],
                    [keys[3]]: ele[3],
                    [keys[4]]: ele[4],
                    [keys[5]]: ele[5],
                    [keys[6]]: ele[6]
                }
            })
            return {
                rows,
                columns
            }
        })

    }),
    async firstLineQuery(condition, data) {
        const queryConfig = condition.query
        const qa = queryConfig.address;
        const queryXSql = queryConfig.xSql;
        const ec = condition.encode;
        const chartData = []

        const xValue = await this.ajax.request(qa + '?tag=array', {
            method: 'POST',
            data: JSON.stringify({ "sql": queryXSql }),
            dataType: 'json'
        })
        chartData.push(xValue)
        // query dimension
        // const productQueryList = await this.ajax.request(qa + '?tag=array', {
        //         method: 'POST',
        //         data: JSON.stringify({"sql":queryDimensionSql}),
        //         dataType: 'json'
        //     })
        let provSql = this.provName === "全国" ? "" : " AND PROVINCE_NAME = '" + this.provName + "'"
        let citySql = this.cityName ? " AND CITY_NAME = '" + this.cityName + "'" : ""
        // TODO 新增加 code
        const productQueryList = [{
            xAxis: "YM",
            yAxis: "PROD_MOM",
            dimensionKeys: "PRODUCT_NAME",
            sql: "SELECT YM, PRODUCT_NAME, AVG(PROD_MOM) AS PROD_MOM FROM " +
                "test2 WHERE MKT IN (SELECT MKT FROM test2 WHERE COMPANY = " +
                "'Sankyo' AND YM = " + this.endDate + " AND PRODUCT_NAME = '" +
                this.prodName + "') AND COMPANY = 'Sankyo' " +
                provSql + citySql + " AND PRODUCT_NAME.keyword = '" + this.prodName +
                "' GROUP BY YM, PRODUCT_NAME.keyword"
        }, {
            xAxis: "YM",
            yAxis: "MKT_MOM",
            dimensionKeys: "MKT",
            sql: "SELECT YM, MKT, AVG(MKT_MOM) AS MKT_MOM FROM test2 WHERE " +
                "MKT IN (SELECT MKT FROM test2 WHERE COMPANY = 'Sankyo' " +
                "AND YM = " + this.endDate + " AND PRODUCT_NAME = '" +
                this.prodName + "') AND COMPANY = 'Sankyo' " +
                provSql + citySql + " GROUP BY YM, MKT.keyword"
        }]

        const allProdData = await all(productQueryList.map(ele => {
            let reqBody = {
                "sql": ele.sql,
                "x-values": xValue
            }
            return this.ajax.request(qa + '?tag=chart&x-axis=' + ele.xAxis + '&y-axis=' + ele.yAxis + '&dimensionKeys=' + ele.dimensionKeys, {

                method: 'POST',
                data: JSON.stringify(reqBody),
                dataType: 'json'
            })
        }))

        allProdData.forEach(ele => {
            chartData.push(ele[1])
        })
        chartData[0].unshift(ec.x)
        chartData[1][0] = "产品"
        for (let i = 0, len = chartData[1].length; i < len; i++) {
            let value = chartData[1][i]
            if (typeof value === "number") {
                chartData[1][i] = (value * 100).toFixed(0)
            }
        }
        for (let i = 0, len = chartData[2].length; i < len; i++) {
            let value = chartData[2][i]
            if (typeof value === "number") {
                chartData[2][i] = (value * 100).toFixed(0)
            }
        }
        chartData[chartData.length - 1][0] = "市场"

        return chartData
        // this.updateChartData(chartConfig, chartData);

    },
    async secondLineQuery(condition, data) {
        let provSql = this.provName === "全国" ? "" : " AND PROVINCE_NAME = '" + this.provName + "'"
        let citySql = this.cityName ? " AND CITY_NAME = '" + this.cityName + "'" : ""
        let prodName = this.prodName
        let endDate = this.endDate

        const queryConfig = condition.query
        const qa = queryConfig.address;
        const queryXSql = queryConfig.xSql;
        const queryDimensionSql = "SELECT PRODUCT_NAME from test2 WHERE MKT IN " +
            "(SELECT MKT FROM test2 WHERE COMPANY = 'Sankyo' AND YM = " +
            endDate + " AND PRODUCT_NAME = '" + prodName +
            "') AND COMPANY = 'Sankyo' AND YM = " + endDate + " " +
            provSql + citySql + " GROUP BY PRODUCT_NAME.keyword " +
            "ORDER BY PROD_SALES_VALUE DESC LIMIT 10";
        const ec = condition.encode;
        const chartData = []

        const xValue = await this.ajax.request(qa + '?tag=array', {
            method: 'POST',
            data: JSON.stringify({ "sql": queryXSql }),
            dataType: 'json'
        })
        chartData.push(xValue)

        // query dimension
        const productQueryList = await this.ajax.request(qa + '?tag=array', {
            method: 'POST',
            data: JSON.stringify({ "sql": queryDimensionSql }),
            dataType: 'json'
        })
        let prodQueryListStr = ""
        productQueryList.forEach(prod => {
            prodQueryListStr += `'${prod}',`
        })
        prodQueryListStr = prodQueryListStr.slice(0, -1)
        function genConfig(prodQuery) {
            return {
                xAxis: "YM",
                yAxis: "PROD_IN_MKT_SHARE",
                dimensionKeys: "PRODUCT_NAME",
                sql: "SELECT YM, PRODUCT_NAME, AVG(PROD_IN_MKT_SHARE) AS " +
                    "PROD_IN_MKT_SHARE FROM test2 WHERE MKT IN " +
                    "(SELECT MKT FROM test2 WHERE COMPANY = 'Sankyo' AND YM = " +
                    endDate + " AND PRODUCT_NAME = '" + prodName +
                    "') AND COMPANY = 'Sankyo' " + provSql + citySql +
                    " AND PRODUCT_NAME.keyword IN (" +
                    prodQuery + ") GROUP BY YM, PRODUCT_NAME.keyword"
            }
        }
        let config = genConfig(prodQueryListStr)
        const reqBody = {
            "sql": config.sql,
            "x-values": xValue
        }

        const allProdData = await this.ajax.request(qa + '?tag=chart&x-axis=' + config.xAxis + '&y-axis=' + config.yAxis + '&dimensionKeys=' + config.dimensionKeys, {
            method: 'POST',
            data: JSON.stringify(reqBody),
            dataType: 'json'
        })
        // 判断当前产品是不是在 top 10 数组中
        // type : boolean
        let isTop = allProdData.some(prodData => prodData[0] === prodName);

        if (!isTop) {
            // 如果不在则去请求
            let curProdQueryConfig = genConfig(`'${prodName}'`)
            let curProdQueryReqBody = {
                "sql": curProdQueryConfig.sql,
                "x-values": xValue
            }
            const currentProd = await this.ajax.request(qa +
                '?tag=chart&x-axis=' + curProdQueryConfig.xAxis +
                '&y-axis=' + curProdQueryConfig.yAxis +
                '&dimensionKeys=' + curProdQueryConfig.dimensionKeys, {
                method: 'POST',
                data: JSON.stringify(curProdQueryReqBody),
                dataType: 'json'
            })
            allProdData.splice(1, 0, currentProd[1])
        } else {
            // 如果在内部，则将其提取到头部
            let currentProd = allProdData.find(prodData => prodData[0] === prodName);
            let index = allProdData.indexOf(currentProd)
            allProdData.splice(index,1);
            allProdData.splice(1,0,currentProd)
        }
        const newAllProdData =  allProdData.map((prod,index)=> {
            if(index === 0) {
                return prod
            }
            return prod.map(ele=>{
                if(typeof ele==="number") {
                    return (100*ele).toFixed(2)
                } 
                return ele
            })
        })
        return newAllProdData
    },
    async firstStackQuery(condition, data) {
        const queryConfig = condition.query
        const qa = queryConfig.address;
        const queryXSql = queryConfig.xSql;
        const ec = condition.encode;
        const chartData = []

        const xValue = await this.ajax.request(qa + '?tag=array', {
            method: 'POST',
            data: JSON.stringify({ "sql": queryXSql }),
            dataType: 'json'
        })
        chartData.push(xValue)
        let provSql = this.provName === "全国" ? "" : " AND PROVINCE_NAME = '" + this.provName + "'"
        let citySql = this.cityName ? " AND CITY_NAME = '" + this.cityName + "'" : ""
        const productQueryList = [{
            xAxis: "YM",
            yAxis: "PROD_SALES_VALUE",
            dimensionKeys: "PRODUCT_NAME",
            sql: "SELECT YM, PRODUCT_NAME, AVG(PROD_SALES_VALUE) AS " +
                "PROD_SALES_VALUE FROM test2 WHERE MKT IN (SELECT MKT FROM " +
                "test2 WHERE COMPANY = 'Sankyo' AND YM = " + this.endDate +
                " AND PRODUCT_NAME = '" + this.prodName + "') AND COMPANY " +
                "= 'Sankyo'" + provSql + citySql +
                " AND PRODUCT_NAME.keyword = '" + this.prodName +
                "' GROUP BY YM, PRODUCT_NAME.keyword"
        }, {
            xAxis: "YM",
            yAxis: "MKT_SALES_VALUE",
            dimensionKeys: "MKT",
            sql: "SELECT YM, MKT, AVG(MKT_SALES_VALUE) AS MKT_SALES_VALUE " +
                "FROM test2 WHERE MKT IN (SELECT MKT FROM test2 WHERE COMPANY " +
                "= 'Sankyo' AND YM = " + this.endDate + " AND PRODUCT_NAME = '" +
                this.prodName + "') AND COMPANY = 'Sankyo' " + provSql +
                citySql + " AND PRODUCT_NAME.keyword <> '" + this.prodName +
                "' GROUP BY YM, MKT.keyword"
        }]
        // TODO 新增加 code

        const allProdData = await all(productQueryList.map(ele => {
            let reqBody = {
                "sql": ele.sql,
                "x-values": xValue
            }
            return this.ajax.request(qa + '?tag=chart&x-axis=' + ele.xAxis + '&y-axis=' + ele.yAxis + '&dimensionKeys=' + ele.dimensionKeys, {
                method: 'POST',
                data: JSON.stringify(reqBody),
                dataType: 'json'
            })
        }))

        allProdData.forEach(ele => {
            chartData.push(!isEmpty(ele) ? ele[1] || [] : [])
        })
        chartData[0].unshift(ec.x)
        chartData[chartData.length - 1][0] = "其它产品"
        return chartData
    },
    async secondStackQuery(condition, data) {
        let endDate = this.endDate
        let prodName = this.prodName
        let provSql = this.provName === "全国" ? "" : " AND PROVINCE_NAME = '" + this.provName + "'"
        let citySql = this.cityName ? " AND CITY_NAME = '" + this.cityName + "'" : ""

        const queryConfig = condition.query
        const qa = queryConfig.address;
        const queryXSql = queryConfig.xSql;
        const queryDimensionSql = "SELECT MOLE_NAME FROM test2 WHERE MKT IN " +
            "(SELECT MKT FROM test2 WHERE COMPANY = 'Sankyo' AND YM = " +
            endDate + " AND PRODUCT_NAME = '" + prodName +
            "') AND COMPANY = 'Sankyo' " + provSql + citySql +
            " GROUP BY MOLE_NAME.keyword"

        const ec = condition.encode;
        const chartData = []

        const xValue = await this.ajax.request(qa + '?tag=array', {
            method: 'POST',
            data: JSON.stringify({ "sql": queryXSql }),
            dataType: 'json'
        })
        chartData.push(xValue)
        // query dimension
        const productQueryList = await this.ajax.request(qa + '?tag=array', {
            method: 'POST',
            data: JSON.stringify({ "sql": queryDimensionSql }),
            dataType: 'json'
        })

        const dealData = productQueryList.map(ele => {
            return {
                xAxis: "YM",
                yAxis: "MOLE_IN_MKT_SHARE",
                dimensionKeys: "MOLE_NAME",
                sql: "SELECT YM, MOLE_NAME, AVG(MOLE_IN_MKT_SHARE) AS " +
                    "MOLE_IN_MKT_SHARE FROM test2 WHERE MKT IN " +
                    "(SELECT MKT FROM test2 WHERE COMPANY = 'Sankyo' " +
                    "AND YM = " + endDate + " AND PRODUCT_NAME = '" + prodName +
                    "') AND COMPANY = 'Sankyo' " +
                    provSql + citySql + " AND MOLE_NAME.keyword = '" +
                    ele + "' GROUP BY YM, MOLE_NAME.keyword"
            }
        })
        const allProdData = await all(dealData.map(config => {

            let reqBody = {
                "sql": config.sql,
                "x-values": xValue
            }
            return this.ajax.request(qa + '?tag=chart&x-axis=' + config.xAxis + '&y-axis=' + config.yAxis + '&dimensionKeys=' + config.dimensionKeys, {
                method: 'POST',
                data: JSON.stringify(reqBody),
                dataType: 'json'
            })
        }))
        allProdData.forEach(ele => {
            chartData.push(ele[1])
        })
        chartData[0].unshift(ec.x)
        return chartData
    },
    changeDate(date) {
        let newDate = new Date(date)
        let year = newDate.getFullYear() + "";
        let month = newDate.getMonth() + 1;

        this.set("endDate", year + (month < 10 ? "0" + month : month))
    },
    actions: {
        changeProv(prov) {
            this.set("provName", prov)
        },
        changeCity(city) {
            this.set("cityName", city)
        },
        changeProd(prod, index) {
            this.set("curIndex", index)
            this.set("prodName", prod)
        },
        emit(source, signal, data) {
            window.console.log("index.js actions.emit")
            // this.mcs.filter( x => x.source === source && x.signal === signal ).forEach( slot => slot.slot( slot.target, data ) )

            const slots = this.mcs.filter(x => x.source === source && x.signal === signal)

            window.console.log(slots)
            slots.forEach(slot => slot.slot(slot.target, data))

        },
        ssc(ss, ts, cs) {
            // window.console.log("index.js")
            this.mss.pushObjects(ss)
            this.mts.pushObjects(ts)
            this.mcs.pushObjects(cs)
            // 去重
            this.mss.uniq()
            this.mts.uniq()
            this.mcs.uniq()

            // window.console.log(this.mcs)
        },
        disconnect() {

        },
    },
});