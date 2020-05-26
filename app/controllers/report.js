import Controller from "@ember/controller";
import { A } from "@ember/array";
import { inject as service } from "@ember/service";
import { all, resolve } from "rsvp";
import { computed, observer } from "@ember/object";
// import { isEmpty } from "@ember/utils";
import ENV from "max-bi-v2/config/environment";
import { format } from 'd3-format';

const { host, port } = ENV.QueryAddress;

export default Controller.extend({
    ajax: service(),
    picOSS: service("pic-oss"),
    propertiesObserver: observer("endDate", "prodName", function () {
        this.set("provName", "全国");
        this.set("cityName", "");
    }),
    provObserver: observer("provName", function () {
        this.set("cityName", "");
    }),
    endDateObserver: observer("endDate", function () {
        // TODO 取消会在初始化过程中执行。
        this.productQuery(this.endDate);
    }),
    // lineLegendContent(data, dimensions, fsm) {
    //     return 'hello line';
    // },
    productQuery(endDate) {
        const queryDimensionSql =
            "SELECT PRODUCT_NAME, AVG(EI_PROD_NATION) " +
            "AS EI, AVG(CURR_PROD_SALES_IN_NATION) AS PROD_SALES, " +
            "AVG(CURR_PROD_RANK_IN_NATION) AS RANK, AVG(MOM_RATE_ON_PROD_NATION) " +
            "AS MOM_RATE FROM result WHERE COMPANY = '" +
            this.compName +
            "' AND DATE = " +
            endDate +
            " GROUP BY COMPANY.keyword, PRODUCT_NAME.keyword ORDER BY RANK";
        const queryParams = {
            tag: "row2line",
            dimensionKeys: "PRODUCT_NAME,EI,PROD_SALES,RANK,MOM_RATE",
        };
        return this.ajax
            .request(
                `${host}:${port}/sql?tag=${queryParams.tag}&dimensionKeys=${queryParams.dimensionKeys}`,
                {
                    method: "POST",
                    data: JSON.stringify({ sql: queryDimensionSql }),
                    dataType: "json",
                }
            )
            .then((data) => {
                let keys = data.slice(0, 1)[0];
                // ["PRODUCT_NAME", "EI", "PROD_SALES", "RANK", "MOM_RATE"]
                return data.slice(1).map((ele) => {
                    return {
                        [keys[0]]: ele[0],
                        [keys[1]]: ele[1],
                        [keys[2]]: ele[2],
                        [keys[3]]: ele[3],
                        [keys[4]]: ele[4],
                    };
                });
            })
            .then((data) => {
                this.set("productData", data);
                this.set("prodName", data[0]["PRODUCT_NAME"]);
                this.set("curIndex", 0);
                return data;
            });
    },
    curIndex: 0,
    prodName: "代文",
    startDate: "",
    endDate: "201906",
    provName: "全国",
    cityName: "",
    // ADD
    // compName: "Sankyo",
    compName: "信立泰",
    mss: A([]),
    mts: A([]),
    mcs: A([]),
    tableColumns: A([
        {
            name: "药品名",
            valuePath: "PRODUCT_NAME",
            isFixed: "left",
            isSortable: false,
        },
        {
            name: "市场规模(Mn)",
            valuePath: "MKT_SALES_VALUE",
            isSortable: true,
            cellComponent: "format-mn",
        },
        {
            name: "市场增长率",
            valuePath: "MKT_MOM",
            isSortable: true,
            cellComponent: "format-percentage",
        },
        {
            name: "产品销售量(Mn)",
            valuePath: "PROD_SALES_VALUE",
            isSortable: true,
            cellComponent: "format-mn",
        },
        {
            name: "产品市场份额",
            valuePath: "PROD_IN_CITY_SHARE",
            isSortable: true,
            cellComponent: "format-percentage",
        },
        {
            name: "产品销售增长率",
            valuePath: "PROD_MOM",
            isSortable: true,
            cellComponent: "format-percentage",
        },
        {
            name: "EI",
            valuePath: "EI",
            isSortable: true,
            cellComponent: "format-decimal",
        },
    ]),
    tableData: computed(
        "endDate",
        "prodName",
        "provName",
        "cityName",
        function () {
            let { endDate, provName, cityName, prodName, compName } = this,
                selectScope =
                    provName === "全国" ? "NATION" : cityName === "" ? "PROV" : "CITY",
                provSql =
                    this.provName === "全国"
                        ? ""
                        : " AND PROVINCE = '" + this.provName.substring(0,2) + "%" + "'",
                citySql = this.cityName ? " AND CITY = '" + this.cityName + "'" : "",
                dimensionValueSql = citySql ? "MONTH-CITY-PRODUCT_NAME" : provSql ? "MONTH-PROVINCE-PRODUCT_NAME" : "MONTH-COUNTRY-PRODUCT_NAME", // 下钻纬度，请求数据到全国/省份/城市
                columns = [
                    {
                        name: "产品名称",
                        valuePath: "PRODUCT_NAME",
                        isFixed: "left",
                        isSortable: false,
                    },
                    {
                        name: "市场规模(Mn)",
                        valuePath: "FATHER_PROD_SALES_VALUE",
                        isSortable: true,
                        cellComponent: "format-mn",
                    },
                    {
                        name: "市场增长率",
                        valuePath: "FATHER_PROD_SALES_VALUE_GROWTH_RATE",
                        isSortable: true,
                        cellComponent: "format-percentage",
                    },
                    {
                        name: "产品销售额(Mn)",
                        valuePath: "FATHER_PROD_SALES_VALUE",
                        isSortable: true,
                        cellComponent: "format-mn",
                    },
                    {
                        name: "产品市场份额",
                        valuePath: "PROD_SHARE",
                        isSortable: true,
                        cellComponent: "format-percentage",
                    },
                    {
                        name: "产品销售增长率",
                        valuePath: "SALES_VALUE_GROWTH_RATE",
                        isSortable: true,
                        cellComponent: "format-percentage",
                    },
                    {
                        name: "EI",
                        valuePath: "PROD_EI",
                        isSortable: true,
                        cellComponent: "format-decimal",
                    },
                ],
                rows = [],
                // queryDimensionSql = `SELECT PRODUCT_NAME, AVG(CURR_MKT_SALES_IN_${selectScope}) AS MKT_SALES, AVG(MOM_RATE_ON_MKT_${selectScope}) AS MKT_MOM, AVG(CURR_PROD_SALES_IN_${selectScope}) AS PROD_SALES, AVG(CURR_PROD_${selectScope}_SHARE) AS PROD_SHARE, AVG(MOM_RATE_ON_PROD_${selectScope}) AS PROD_MOM, AVG(EI_PROD_${selectScope}) AS EI FROM cube WHERE MKT IN (SELECT MKT FROM cube WHERE COMPANY = '${compName}' AND DATE = ${endDate} AND PRODUCT_NAME = '${prodName}') AND COMPANY = '${compName}' AND DATE = ${endDate} ${provSql} ${citySql} GROUP BY PRODUCT_NAME.keyword`,
                queryDimensionSql = `SELECT PRODUCT_NAME,FATHER_PROD_SALES_VALUE,FATHER_PROD_SALES_VALUE_GROWTH_RATE,FATHER_PROD_SALES_VALUE,PROD_SHARE,SALES_VALUE_GROWTH_RATE,PROD_EI FROM cube WHERE DIMENSION_NAME = '3-time-geo-prod' AND DIMENSION_VALUE = '${dimensionValueSql}' AND MKT IN (SELECT MKT FROM cube WHERE DIMENSION_NAME = '2-time-prod' AND DIMENSION_VALUE = 'MONTH-PRODUCT_NAME' AND COMPANY = '${compName}' AND YEAR = 2019 AND QUARTER = 1 AND MONTH = 2 AND PRODUCT_NAME = '${prodName}') AND COMPANY = '${compName}' ${provSql} AND COUNTRY = 'CHINA' AND YEAR = 2019 AND QUARTER = 1 AND MONTH = 2`,
                reqBody = {
                    sql: queryDimensionSql,
                },
                ec = {
                    tag: "row2line",
                    dimension:
                        // "PRODUCT_NAME,MKT_SALES,MKT_MOM,PROD_SALES,PROD_SHARE,PROD_MOM,EI",
                        "PRODUCT_NAME,FATHER_PROD_SALES_VALUE,FATHER_PROD_SALES_VALUE_GROWTH_RATE,FATHER_PROD_SALES_VALUE,PROD_SHARE,SALES_VALUE_GROWTH_RATE,PROD_EI",
                };
            
            return this.ajax
                .request(
                    `${host}:${port}/sql?tag=${ec.tag}&dimensionKeys=${ec.dimension}`,
                    {
                        method: "POST",
                        data: JSON.stringify(reqBody),
                        dataType: "json",
                    }
                )
                .then((data) => {
                    let keys = data[0];
                    let rowRawData = data.slice(1);
                    rows = rowRawData.map((ele) => {
                        return {
                            [keys[0]]: ele[0],
                            [keys[1]]: ele[1],
                            [keys[2]]: ele[2],
                            [keys[3]]: ele[3],
                            [keys[4]]: ele[4],
                            [keys[5]]: ele[5],
                            [keys[6]]: ele[6],
                        };
                    });
                    console.log({
                        rows,
                        columns
                    })
                    return {
                        rows,
                        columns,
                    };
                });
        }
    ),
    /**
        async firstLineQuery(condition, data) {
            const queryConfig = condition.query;
            const qa = queryConfig.address;
            let { compName, prodName, endDate, provName, cityName } = this;
            const xSql = `SELECT YM FROM result WHERE COMPANY = '${this.compName}' GROUP BY DATE ORDER BY DATE`;
            const ec = condition.encode;
            const chartData = [];

            const xValue = await this.ajax.request(qa + "?tag=array", {
                method: "POST",
                data: JSON.stringify({ sql: xSql }),
                dataType: "json",
            });
            chartData.push(xValue);
            let provSql =
                this.provName === "全国" ? "" : " AND PROVINCE = '" + provName + "'";
            let citySql = this.cityName ? " AND CITY = '" + cityName + "'" : "";

            const productQueryList = [
                {
                    xAxis: "DATE",
                    yAxis: "MOM_RATE",
                    dimensionKeys: "PRODUCT_NAME",
                    sqlOld:
                        "SELECT YM, PRODUCT_NAME, AVG(PROD_MOM) AS PROD_MOM FROM " +
                        "test2 WHERE MKT IN (SELECT MKT FROM test2 WHERE COMPANY = " +
                        "'" +
                        this.compName +
                        "' AND YM = " +
                        this.endDate +
                        " AND PRODUCT_NAME = '" +
                        this.prodName +
                        "') AND COMPANY = '" +
                        this.compName +
                        "' " +
                        provSql +
                        citySql +
                        " AND PRODUCT_NAME.keyword = '" +
                        this.prodName +
                        "' GROUP BY YM, PRODUCT_NAME.keyword",
                    sql:
                        "SELECT DATE, PRODUCT_NAME, AVG(MOM_RATE_ON_PROD_CITY) AS " +
                        "MOM_RATE FROM result WHERE MKT IN (SELECT MKT FROM result " +
                        "WHERE COMPANY = '" +
                        compName +
                        "' AND DATE = " +
                        endDate +
                        " AND PRODUCT_NAME = '" +
                        prodName +
                        "') AND COMPANY = '" +
                        compName +
                        "' " +
                        provSql +
                        citySql +
                        " AND PRODUCT_NAME.keyword = '" +
                        prodName +
                        "' GROUP BY DATE, PRODUCT_NAME.keyword",
                },
                {
                    xAxis: "DATE",
                    yAxis: "MOM_RATE",
                    dimensionKeys: "MKT",
                    sqlOld:
                        "SELECT YM, MKT, AVG(MKT_MOM) AS MKT_MOM FROM test2 WHERE " +
                        "MKT IN (SELECT MKT FROM test2 WHERE COMPANY = '" +
                        this.compName +
                        "' " +
                        "AND YM = " +
                        this.endDate +
                        " AND PRODUCT_NAME = '" +
                        this.prodName +
                        "') AND COMPANY = '" +
                        this.compName +
                        "' " +
                        provSql +
                        citySql +
                        " GROUP BY YM, MKT.keyword",
                    sql:
                        "SELECT DATE, MKT, AVG(MOM_RATE_ON_MKT_CITY) AS MOM_RATE" +
                        " FROM result WHERE MKT IN (SELECT MKT FROM result WHERE " +
                        "COMPANY = '" +
                        compName +
                        "' AND DATE = " +
                        endDate +
                        " AND PRODUCT_NAME = '" +
                        prodName +
                        "') AND COMPANY = '" +
                        compName +
                        "' " +
                        provSql +
                        citySql +
                        " GROUP BY DATE, MKT.keyword",
                },
            ];

            const allProdData = await all(
                productQueryList.map((ele) => {
                    let reqBody = {
                        sql: ele.sql,
                        "x-values": xValue,
                    };
                    return this.ajax.request(
                        qa +
                        "?tag=chart&x-axis=" +
                        ele.xAxis +
                        "&y-axis=" +
                        ele.yAxis +
                        "&dimensionKeys=" +
                        ele.dimensionKeys,
                        {
                            method: "POST",
                            data: JSON.stringify(reqBody),
                            dataType: "json",
                        }
                    );
                })
            );

            allProdData.forEach((ele) => {
                chartData.push(ele[1]);
            });
            chartData[0].unshift(ec.x);
            chartData[1][0] = "产品";
            for (let i = 0, len = chartData[1].length; i < len; i++) {
                let value = chartData[1][i];
                if (typeof value === "number") {
                    chartData[1][i] = (value * 100).toFixed(0);
                }
            }
            for (let i = 0, len = chartData[2].length; i < len; i++) {
                let value = chartData[2][i];
                if (typeof value === "number") {
                    chartData[2][i] = (value * 100).toFixed(0);
                }
            }
            chartData[chartData.length - 1][0] = "市场";

            return chartData;
        },
        async secondLineQuery(condition, data) {
            let { provName, cityName, endDate, prodName, compName } = this;
            let provSql =
                provName === "全国" ? "" : " AND PROVINCE = '" + provName + "'";
            let citySql = cityName ? " AND CITY = '" + cityName + "'" : "";
            let selectScope =
                provName === "全国" ? "NATION" : cityName === "" ? "PROV" : "CITY";
            const xSql = `SELECT YM FROM result WHERE COMPANY = '${compName}' GROUP BY DATE ORDER BY DATE`;

            const queryConfig = condition.query;
            const qa = queryConfig.address;
            let queryDimensionSql =
                "SELECT PRODUCT_NAME from result WHERE MKT IN " +
                "(SELECT MKT FROM result WHERE COMPANY = '" +
                compName +
                "' AND DATE = " +
                endDate +
                " AND PRODUCT_NAME = '" +
                prodName +
                "') AND COMPANY = '" +
                compName +
                "' AND DATE = " +
                endDate +
                provSql +
                citySql +
                " GROUP BY PRODUCT_NAME.keyword ORDER BY " +
                `CURR_PROD_SALES_IN_${selectScope} DESC LIMIT 10`;
            const ec = condition.encode;
            const chartData = [];

            const xValue = await this.ajax.request(qa + "?tag=array", {
                method: "POST",
                data: JSON.stringify({ sql: xSql }),
                dataType: "json",
            });
            chartData.push(xValue);

            const productQueryList = await this.ajax.request(qa + "?tag=array", {
                method: "POST",
                data: JSON.stringify({ sql: queryDimensionSql }),
                dataType: "json",
            });
            let prodQueryListStr = "";
            productQueryList.forEach((prod) => {
                prodQueryListStr += `'${prod}',`;
            });
            prodQueryListStr = prodQueryListStr.slice(0, -1);
            function genConfig(prodQuery) {
                return {
                    xAxis: "DATE",
                    yAxis: "PROD_SHARE",
                    dimensionKeys: "PRODUCT_NAME",
                    sql:
                        `SELECT DATE, PRODUCT_NAME, AVG(CURR_PROD_${selectScope}_SHARE) ` +
                        "AS PROD_SHARE FROM result WHERE MKT IN (SELECT MKT FROM " +
                        `result WHERE COMPANY = '${compName}' AND DATE = ${endDate} ` +
                        `AND PRODUCT_NAME = '${prodName}') AND COMPANY = '${compName}' ` +
                        provSql +
                        citySql +
                        " AND PRODUCT_NAME.keyword IN (" +
                        prodQuery +
                        ") GROUP BY DATE, PRODUCT_NAME.keyword",
                };
            }
            let config = genConfig(prodQueryListStr);
            const reqBody = {
                sql: config.sql,
                "x-values": xValue,
            };

            const allProdData = await this.ajax.request(
                qa +
                "?tag=chart&x-axis=" +
                config.xAxis +
                "&y-axis=" +
                config.yAxis +
                "&dimensionKeys=" +
                config.dimensionKeys,
                {
                    method: "POST",
                    data: JSON.stringify(reqBody),
                    dataType: "json",
                }
            );
            // 判断当前产品是不是在 top 10 数组中
            // type : boolean
            let isTop = allProdData.some((prodData) => prodData[0] === prodName);

            if (!isTop) {
                // 如果不在则去请求
                let curProdQueryConfig = genConfig(`'${prodName}'`);
                let curProdQueryReqBody = {
                    sql: curProdQueryConfig.sql,
                    "x-values": xValue,
                };
                const currentProd = await this.ajax.request(
                    qa +
                    "?tag=chart&x-axis=" +
                    curProdQueryConfig.xAxis +
                    "&y-axis=" +
                    curProdQueryConfig.yAxis +
                    "&dimensionKeys=" +
                    curProdQueryConfig.dimensionKeys,
                    {
                        method: "POST",
                        data: JSON.stringify(curProdQueryReqBody),
                        dataType: "json",
                    }
                );
                allProdData.splice(1, 0, currentProd[1]);
            } else {
                // 如果在内部，则将其提取到头部
                let currentProd = allProdData.find(
                    (prodData) => prodData[0] === prodName
                );
                let index = allProdData.indexOf(currentProd);
                allProdData.splice(index, 1);
                allProdData.splice(1, 0, currentProd);
            }
            const newAllProdData = allProdData.map((prod, index) => {
                if (index === 0) {
                    return prod;
                }
                return prod.map((ele) => {
                    if (typeof ele === "number") {
                        return (100 * ele).toFixed(2);
                    }
                    return ele;
                });
            });
            return newAllProdData;
        },
        async firstStackQuery(condition, data) {
            const queryConfig = condition.query;
            const qa = queryConfig.address;
            // const queryXSql = queryConfig.xSql;
            const ec = condition.encode;
            const chartData = [];
            const xSql = `SELECT YM FROM result WHERE COMPANY = '${this.compName}' GROUP BY DATE ORDER BY DATE`;
            // 每次都是返回最新的一年，需要修改
            const xValue = await this.ajax.request(qa + "?tag=array", {
                method: "POST",
                data: JSON.stringify({ sql: xSql }),
                dataType: "json",
            });
            chartData.push(xValue);
            let provSql =
                this.provName === "全国" ? "" : " AND PROVINCE = '" + this.provName + "'";
            let citySql = this.cityName ? " AND CITY = '" + this.cityName + "'" : "";
            const productQueryList = [
                {
                    xAxis: "DATE",
                    yAxis: "PROD_SALES",
                    dimensionKeys: "PRODUCT_NAME",
                    sql:
                        "SELECT DATE, PRODUCT_NAME, AVG(CURR_PROD_SALES_IN_CITY) " +
                        "AS PROD_SALES FROM result WHERE MKT IN (SELECT MKT FROM " +
                        "result WHERE COMPANY = '" +
                        this.compName +
                        "' AND DATE = " +
                        this.endDate +
                        " AND PRODUCT_NAME = '" +
                        this.prodName +
                        "') AND COMPANY = '" +
                        this.compName +
                        "' " +
                        provSql +
                        citySql +
                        " AND PRODUCT_NAME.keyword = '" +
                        this.prodName +
                        "' GROUP BY DATE, PRODUCT_NAME.keyword",
                },
                {
                    xAxis: "DATE",
                    yAxis: "MKT_SALES",
                    dimensionKeys: "MKT",
                    sql:
                        "SELECT DATE, MKT, AVG(CURR_MKT_SALES_IN_CITY) AS MKT_SALES" +
                        " FROM result WHERE MKT IN (SELECT MKT FROM result WHERE " +
                        "COMPANY = '" +
                        this.compName +
                        "' AND DATE = " +
                        this.endDate +
                        " AND PRODUCT_NAME = '" +
                        this.prodName +
                        "') AND COMPANY = '" +
                        this.compName +
                        "' " +
                        provSql +
                        citySql +
                        " GROUP BY DATE, MKT.keyword",
                },
            ];
            const allProdData = await all(
                productQueryList.map((ele) => {
                    let reqBody = {
                        sql: ele.sql,
                        "x-values": xValue,
                    };
                    return this.ajax.request(
                        qa +
                        "?tag=chart&x-axis=" +
                        ele.xAxis +
                        "&y-axis=" +
                        ele.yAxis +
                        "&dimensionKeys=" +
                        ele.dimensionKeys,
                        {
                            method: "POST",
                            data: JSON.stringify(reqBody),
                            dataType: "json",
                        }
                    );
                })
            );

            allProdData.forEach((ele) => {
                chartData.push(!isEmpty(ele) ? ele[1] || [] : []);
            });
            chartData[0].unshift(ec.x);
            chartData[chartData.length - 1][0] = "其它产品";
            return chartData;
        },
        async secondStackQuery(condition, data) {
            let { provName, cityName, endDate, prodName, compName } = this;
            let provSql =
                provName === "全国" ? "" : ` AND PROVINCE = '${provName}'`;
            let citySql = cityName ? " AND CITY = '" + cityName + "'" : "";
            let selectScope =
                provName === "全国" ? "NATION" : cityName === "" ? "PROV" : "CITY";

            const queryConfig = condition.query;
            const qa = queryConfig.address;
            const xSql = `SELECT YM FROM result WHERE COMPANY = '${compName}' GROUP BY DATE ORDER BY DATE`;

            const ec = condition.encode;
            const chartData = [];

            const xValue = await this.ajax.request(qa + "?tag=array", {
                method: "POST",
                data: JSON.stringify({ sql: xSql }),
                dataType: "json",
            });
            chartData.push(xValue);
            const config = {
                xAxis: "DATE",
                yAxis: "MOLE_SHARE",
                dimensionKeys: "MOLE_NAME",
                sql:
                    `SELECT DATE, MOLE_NAME, AVG(CURR_MOLE_${selectScope}_SHARE) AS ` +
                    "MOLE_SHARE FROM result WHERE MKT IN (SELECT MKT FROM " +
                    "result WHERE COMPANY = '" +
                    compName +
                    "' AND DATE = " +
                    endDate +
                    " AND PRODUCT_NAME = '" +
                    prodName +
                    "') AND COMPANY = '" +
                    compName +
                    "' " +
                    provSql +
                    citySql +
                    " GROUP BY DATE, MOLE_NAME.keyword",
            };
            let reqBody = {
                sql: config.sql,
                "x-values": xValue,
            };
            const prodData = await this.ajax.request(
                qa +
                "?tag=chart&x-axis=" +
                config.xAxis +
                "&y-axis=" +
                config.yAxis +
                "&dimensionKeys=" +
                config.dimensionKeys,
                {
                    method: "POST",
                    data: JSON.stringify(reqBody),
                    dataType: "json",
                }
            );
            prodData.shift();
            prodData.forEach((ele) => {
                chartData.push(ele);
            });
            chartData[0].unshift(ec.x);

            return chartData;
        },
    */
    firstStackUpdate(fsm, dimensions, fc) {

        let { comp, prov, prod, endDate } = this.getProperties("comp", "prov", "prod", "endDate"),
            state = fsm.state,
            sqlDimensions = dimensions.map((item) => {
                if (fsm[item]) {
                    return `AND ${item}.keyword = '${fsm[item]}'`;
                }
                return "";
            }),
            area = prov === "全国" ? "COUNTRY" : "PROVINCE";

        endDate = endDate.toString();
        let year = endDate.slice(0, 4),
            month = endDate.slice(4);

        prov = prov === "全国" ? "CHINA" : prov;

        return all([
            fetch(`${fc.address}?tag=${fc.tag}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    sql: `SELECT ${state}, PRODUCT_NAME, SALES_VALUE, SALES_QTY,SALES_VALUE_GROWTH,SALES_QTY_GROWTH,SALES_VALUE_GROWTH_RATE,SALES_QTY_GROWTH_RATE FROM ${fc.db} WHERE DIMENSION_NAME = '3-time-geo-prod' AND DIMENSION_VALUE = '${state}-${area}-PRODUCT_NAME' AND COMPANY = '${comp}' AND ${area} = '${prov}' AND PRODUCT_NAME = '${prod}' ${sqlDimensions.join(
                        " "
                    )} ORDER BY ${state}.keyword`,
                }),
            }),
            fetch(`${fc.address}?tag=${fc.tag}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    sql: `SELECT ${state}, MKT, SALES_VALUE, SALES_QTY,SALES_VALUE_GROWTH,SALES_QTY_GROWTH,SALES_VALUE_GROWTH_RATE,SALES_QTY_GROWTH_RATE FROM ${fc.db} WHERE MKT IN (SELECT MKT FROM  ${fc.db} WHERE DIMENSION_NAME.keyword = '2-time-prod' AND DIMENSION_VALUE.keyword = 'MONTH-PRODUCT_NAME' AND COMPANY = '${comp}' AND YEAR = ${year} AND MONTH = ${month} AND PRODUCT_NAME.keyword = '${prod}') AND DIMENSION_NAME.keyword = '3-time-geo-prod' AND DIMENSION_VALUE.keyword = '${state}-${area}-MKT' AND COMPANY.keyword = '${comp}' AND ${area}.keyword = '${prov}' ${sqlDimensions.join(
                        " "
                    )} ORDER BY ${state}.keyword`,
                }),
            }),
        ])
            .then((result) => {
                return all(
                    result.map((res) => {
                        return res.json();
                    })
                );
            })
            .then((data) => {
                let time = data[0].map((item) => {
                    return {
                        [fsm.state]: item[fsm.state],
                    };
                }),
                    result = time.reduce((acc, cur, i) => {

                        cur[data[0][i]["PRODUCT_NAME"]] = data[0][i]["SALES_VALUE"];
                        cur["其他产品"] =
                            data[1][i]["SALES_VALUE"] - data[0][i]["SALES_VALUE"];
                        return acc;
                    }, time);
                return result;
            });
    },
    firstLineUpdate(fsm, dimensions, fc) {
        let { comp, prov, prod, endDate } = this.getProperties("comp", "prov", "prod", "endDate"),
            state = fsm.state,
            sqlDimensions = dimensions.map(item => {
                if (fsm[item]) {
                    return `AND ${item}.keyword = '${fsm[item]}'`
                }
                return ''
            }),
            area = prov === "全国" ? "COUNTRY" : "PROVINCE";

        endDate = endDate.toString();
        let year = endDate.slice(0, 4),
            month = endDate.slice(4);

        prov = prov === "全国" ? "CHINA" : prov;

        return all([
            fetch(`${fc.address}?tag=${fc.tag}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ "sql": `SELECT ${state}, PRODUCT_NAME, SALES_VALUE,SALES_QTY,SALES_VALUE_GROWTH,SALES_QTY_GROWTH,SALES_VALUE_GROWTH_RATE,SALES_QTY_GROWTH_RATE,FATHER_GEO_SALES_VALUE_GROWTH,FATHER_GEO_SALES_VALUE_GROWTH_RATE FROM ${fc.db} WHERE DIMENSION_NAME.keyword = '3-time-geo-prod' AND DIMENSION_VALUE.keyword = '${state}-${area}-PRODUCT_NAME' AND COMPANY = '${comp}' AND ${area} = '${prov}' AND PRODUCT_NAME.keyword = '${prod}' ${sqlDimensions.join(" ")} ORDER BY ${state}.keyword` }),
            }),
            fetch(`${fc.address}?tag=${fc.tag}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ "sql": `SELECT ${state}, MKT, SALES_VALUE, SALES_QTY,SALES_VALUE_GROWTH,SALES_QTY_GROWTH,SALES_VALUE_GROWTH_RATE,SALES_QTY_GROWTH_RATE,FATHER_GEO_SALES_VALUE_GROWTH,FATHER_GEO_SALES_VALUE_GROWTH_RATE FROM ${fc.db} WHERE MKT IN (SELECT MKT FROM ${fc.db} WHERE DIMENSION_NAME.keyword = '2-time-prod' AND DIMENSION_VALUE.keyword = 'MONTH-PRODUCT_NAME' AND COMPANY = '${comp}' AND YEAR = ${year} AND MONTH = ${month} AND PRODUCT_NAME.keyword = '${prod}') AND DIMENSION_NAME.keyword = '3-time-geo-prod' AND DIMENSION_VALUE.keyword = '${state}-${area}-MKT' AND COMPANY.keyword = '${comp}' AND ${area}.keyword = '${prov}' ${sqlDimensions.join(" ")} ORDER BY ${state}.keyword` }),
            })
        ]).then((result) => {
            return all(result.map((res) => {
                return res.json()
            }))
        }).then((data) => {
            return data.map(items => {
                return items.map(item => {
                    if (item['PRODUCT_NAME']) {
                        item['legendLable'] = '产品'
                    } else if (item['MKT']) {
                        item['legendLable'] = '市场'
                    }
                    return item
                })
            });
        })
    },
    secondStackUpdate(fsm, dimensions, fc) {
        let { comp, prov, prod, endDate } = this.getProperties("comp", "prov", "prod", "endDate"),
            state = fsm.state,
            sqlDimensions = dimensions.map(item => {
                if (fsm[item]) {
                    return `AND ${item}.keyword = '${fsm[item]}'`
                }
                return ''
            }),
            area = prov === "全国" ? "COUNTRY" : "PROVINCE";
        endDate = endDate.toString();
        let year = endDate.slice(0, 4),
            month = endDate.slice(4);
        prov = prov === "全国" ? "CHINA" : prov;

        return fetch(`${fc.address}?tag=${fc.tag}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "sql": `SELECT ${state}, MOLE_NAME, SUM(SALES_QTY) AS SALES_QTY, SUM(SALES_VALUE) AS SALES_VALUE, SUM(FATHER_PROD_SALES_QTY) AS MKT_SALES_QTY, SUM(FATHER_PROD_SALES_VALUE) AS MKT_SALES_VALUE, AVG(PROD_SHARE) AS SHARE FROM ${fc.db} WHERE DIMENSION_NAME.keyword = '3-time-geo-prod' AND DIMENSION_VALUE.keyword = '${state}-${area}-MOLE_NAME' AND COMPANY = '${comp}' AND ${area} = '${prov}' AND MKT IN (SELECT MKT FROM ${fc.db} WHERE DIMENSION_NAME.keyword = '2-time-prod' AND DIMENSION_VALUE.keyword = 'MONTH-PRODUCT_NAME' AND COMPANY.keyword = '${comp}' AND YEAR = ${year} AND MONTH = ${month} AND PRODUCT_NAME = '${prod}') ${sqlDimensions.join(" ")}  GROUP BY ${state}.keyword, MOLE_NAME.keyword ORDER BY ${state}.keyword` }),
        }).then((result) => {
            return result.json()
        }).then((data) => {
            // 由于堆叠图的数据特殊性,这里是放在外部进行 format
            // 导致 yAxis.dimension 属性不会起作用
            // 是否应该放入 histogram.parseData()方法中?
            let timeStr = [...new Set(data.map((item) => item[fsm.state]))],
                time = timeStr.map((item) => {
                    return {
                        [fsm.state]: item
                    }
                }),
                result = time.reduce((acc, cur) => {
                    let state = fsm.state,
                        curTimeData = data.filter((item) => item[state] === cur[state]);

                    curTimeData.forEach((item) => {
                        cur[item['MOLE_NAME']] = item['SHARE']
                    })

                    return acc;
                }, time);
            return result
        })
    },
    secondStackLegendContent(data, dimensions, jsm) {
        let prods = Object.keys(data);

        prods.splice(prods.indexOf(jsm['state']), 1);
        let total = prods.reduce((acc, cur) => {
            return acc + data[cur];
        }, 0)
        let prodsTooltip = prods.map(prod => `<p>${prod} ${format(".1%")(data[prod])}</p>`).join(" ")
        return `<p>${data[jsm['state']]} </p>
                <p><span>总和</span> <span>${format(".1%")(total)}</span></p>
                ${prodsTooltip}`;
    },
    secondLineUpdate(fsm, dimensions, fc) {
        let { comp, prov, prod, endDate } = this.getProperties("comp", "prov", "prod", "endDate"),
            state = fsm.state,
            sqlDimensions = dimensions.map(item => {
                if (fsm[item]) {
                    return `AND ${item}.keyword = '${fsm[item]}'`
                }
                return ''
            }),
            area = prov === "全国" ? "COUNTRY" : "PROVINCE";
        endDate = endDate.toString();
        let year = endDate.slice(0, 4),
            month = endDate.slice(4);
        prov = prov === "全国" ? "CHINA" : prov;

        return resolve(fetch(`${fc.address}?tag=array`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "sql": `SELECT PRODUCT_NAME FROM ${fc.db} WHERE MKT IN (SELECT MKT FROM ${fc.db} WHERE DIMENSION_NAME.keyword = '2-time-prod' AND DIMENSION_VALUE.keyword = 'MONTH-PRODUCT_NAME' AND COMPANY = '${comp}' AND YEAR = ${year} AND MONTH = ${month} AND PRODUCT_NAME.keyword = '${prod}') AND DIMENSION_NAME = '3-time-geo-prod' AND DIMENSION_VALUE = 'MONTH-${area}-PRODUCT_NAME' AND COMPANY = '${comp}' AND YEAR = ${year} AND MONTH = ${month} AND ${area} = '${prov}' ORDER BY SALES_VALUE DESC LIMIT 10` }),
        })).then((data) => {
            return data.json()
        }).then((data) => {
            if (data.includes(prod)) {
                data.splice(data.indexOf(prod), 1)
            }
            data.unshift(prod)
            return all(data.map((curProd) => {
                return fetch(`${fc.address}?tag=${fc.tag}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "sql": `SELECT ${state}, PRODUCT_NAME, SALES_VALUE,PROD_SHARE,SALES_QTY,SALES_VALUE_GROWTH,SALES_QTY_GROWTH,SALES_VALUE_GROWTH_RATE,SALES_QTY_GROWTH_RATE FROM ${fc.db} WHERE DIMENSION_NAME = '3-time-geo-prod' AND DIMENSION_VALUE = '${state}-${area}-PRODUCT_NAME' AND COMPANY = '${comp}' AND ${area} = '${prov}' AND PRODUCT_NAME.keyword = '${curProd}' ${sqlDimensions.join(" ")} ORDER BY ${state}.keyword` }),
                })
            }))
        }).then((result) => {
            return all(result.map((res) => {
                return res.json()
            }))
        }).then((data) => {
            return data.map(items => {
                return items.map(item => {
                    if (item['PRODUCT_NAME']) {
                        item['legendLable'] = item['PRODUCT_NAME']
                    } else if (item['MKT']) {
                        item['legendLable'] = item['MKT']
                    }
                    return item
                })
            });
        })
    },
    secondLineLegendContent(data, dimensions, jsm) {
        let prodsTooltip = data.map(prod => {
            if (prod) {
                return `<p>${prod.legendLable} ${format(".2%")(prod[dimensions[1]])}</p>`
            } else {
                return ''
            }
        }).join(" ")

        return `<p>${data.reduce((acc,cur) => cur?cur:acc,null)[jsm['state']]} </p>
                ${prodsTooltip}`;
    },
    mapAndScatterUpdate(fsm, dimensions, fc) {
        let { comp, prov, prod, endDate } = this.getProperties("comp", "prov", "prod", "endDate");
        return new Promise((resolve) => {
            let state = fsm.state,
                sqlDimensions = dimensions.map(item => {
                    if (fsm[item]) {
                        return `AND ${item}.keyword = '${fsm[item]}'`
                    }
                    return ''
                }),
                area = prov === "全国" ? "COUNTRY" : "PROVINCE";
            prov = prov === "全国" ? "CHINA" : prov;
            endDate = endDate.toString();
            let year = endDate.slice(0, 4),
                month = endDate.slice(4);

            // prov === "CHINA" ? fsm.state = "PROVINCE":fsm.state = "CITY";
            // state = fsm.state
            // TODO 内部具体动作应该提出到组件或者路由中操作
            if (state == "PROVINCE") {
                resolve(fetch(`${fc.address}?tag=${fc.tag}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "sql": `SELECT ${state}, SALES_VALUE, SALES_QTY, GEO_EI, PROD_SALES, SALES_VALUE_GROWTH_RATE,SALES_QTY_GROWTH_RATE FROM ${fc.db} WHERE MKT IN (SELECT MKT FROM ${fc.db} WHERE DIMENSION_NAME.keyword = '2-time-prod' AND DIMENSION_VALUE.keyword = 'MONTH-PRODUCT_NAME' AND COMPANY.keyword = '${comp}' AND YEAR = ${year} AND MONTH = ${month} AND PRODUCT_NAME = '${prod}') AND DIMENSION_NAME = '3-time-geo-prod' AND DIMENSION_VALUE = 'MONTH-${state}-MKT' AND COMPANY = '${comp}' AND YEAR = ${year} AND MONTH = ${month} AND ${area} = '${prov}'` }),
                }))
            } else if (state === 'CITY') {
                let stateProv = fsm[dimensions[0]]
                resolve(fetch(`${fc.address}?tag=${fc.tag}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "sql": `SELECT ${state}, SALES_VALUE, SALES_QTY, GEO_EI, PROD_SALES, SALES_VALUE_GROWTH_RATE,SALES_QTY_GROWTH_RATE FROM ${fc.db} WHERE MKT IN (SELECT MKT FROM ${fc.db} WHERE DIMENSION_NAME.keyword = '2-time-prod' AND DIMENSION_VALUE.keyword = 'MONTH-PRODUCT_NAME' AND COMPANY.keyword = '${comp}' AND YEAR = ${year} AND MONTH = ${month} AND PRODUCT_NAME = '${prod}') AND DIMENSION_NAME = '3-time-geo-prod' AND DIMENSION_VALUE = 'MONTH-${state}-MKT' AND COMPANY = '${comp}' AND YEAR = ${year} AND MONTH = ${month} AND PROVINCE.keyword like '${stateProv}%'` }),
                }))
            }
        }).then((result) => {
            return result.json();
        }).then(data => {
            return data;
        })
    },
    scatterUpdate(fsm, dimensions, fc) {

        let { comp, prov, prod, endDate } = this.getProperties("comp", "prov", "prod", "endDate");

        return new Promise((resolve) => {
            let state = fsm.state,
                sqlDimensions = dimensions.map(item => {
                    if (fsm[item]) {
                        return `AND ${item}.keyword = '${fsm[item]}'`
                    }
                    return ''
                }),
                area = prov === "全国" ? "COUNTRY" : "PROVINCE";
            prov = prov === "全国" ? "CHINA" : prov;
            endDate = endDate.toString();
            let year = endDate.slice(0, 4),
                month = endDate.slice(4);

            // prov === "CHINA" ? 
            //     fsm.state == "PROVINCE" ?"" :fsm.rollup():
            //     fsm.state == "PROVINCE" ? fsm.drilldown() :"";
            // state = fsm.state;
            // TODO 内部具体动作应该提出到组件或者路由中操作
            if (state == "PROVINCE") {
                resolve(fetch(`${fc.address}?tag=${fc.tag}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "sql": `SELECT ${state}, SALES_VALUE, SALES_QTY,PROD_EI, GEO_EI, PROD_SALES, SALES_VALUE_GROWTH_RATE,SALES_QTY_GROWTH_RATE,FATHER_GEO_SALES_VALUE_GROWTH_RATE,PROD_SHARE FROM ${fc.db} WHERE DIMENSION_NAME = '3-time-geo-prod' AND DIMENSION_VALUE = 'MONTH-${state}-PRODUCT_NAME' AND PRODUCT_NAME = '${prod}' AND COMPANY = '${comp}' AND ${area} = '${prov}' AND YEAR = ${year} AND MONTH = ${month}` }),
                }))
            } else if (state === 'CITY') {
                let stateProv = fsm[dimensions[0]]
                resolve(fetch(`${fc.address}?tag=${fc.tag}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "sql": `SELECT ${state}, SALES_VALUE, SALES_QTY,PROD_EI, GEO_EI, PROD_SALES, SALES_VALUE_GROWTH_RATE,SALES_QTY_GROWTH_RATE,FATHER_GEO_SALES_VALUE_GROWTH_RATE,PROD_SHARE FROM ${fc.db} WHERE DIMENSION_NAME = '3-time-geo-prod' AND DIMENSION_VALUE = 'MONTH-${state}-PRODUCT_NAME' AND PRODUCT_NAME = '${prod}' AND COMPANY = '${comp}' AND COUNTRY = 'CHINA' AND PROVINCE = '${stateProv}%' AND YEAR = ${year} AND MONTH = ${month}` }),
                }))
            }
        }).then((result) => {
            return result.json();
        }).then(data => {
            return data;
        })
    },
    changeDate(date) {
        let newDate = new Date(date),
            year = newDate.getFullYear() + "",
            month = newDate.getMonth() + 1;

        this.set("endDate", year + (month < 10 ? "0" + month : month));
    },
    actions: {
        changeProv(prov) {
            this.set("provName", prov);

        },
        changeCity(city) {
            this.set("cityName", city);
        },
        changeProd(prod, index) {
            this.set("curIndex", index);
            this.set("prodName", prod);
        },
        emit(source, signal, data) {
            window.console.log("index.js actions.emit");
            // this.mcs.filter( x => x.source === source && x.signal === signal ).forEach( slot => slot.slot( slot.target, data ) )

            const slots = this.mcs.filter(
                (x) => x.source === source && x.signal === signal
            );

            window.console.log(slots);
            slots.forEach((slot) => slot.slot(slot.target, data));
        },
        ssc(ss, ts, cs) {
            // window.console.log("index.js")
            this.mss.pushObjects(ss);
            this.mts.pushObjects(ts);
            this.mcs.pushObjects(cs);
            // 去重
            this.mss.uniq();
            this.mts.uniq();
            this.mcs.uniq();

            // window.console.log(this.mcs)
        },
        disconnect() { },
    },
});
