import uuid from 'uuid';
import Chart from 'chart.js'


var config = {
    apiKey: "AIzaSyAWMVNSy3CHbFpUhVrP63Lvj_M-sBX-qQY",
    authDomain: "irich-1d247.firebaseapp.com",
    databaseURL: "https://irich-1d247.firebaseio.com",
    storageBucket: "irich-1d247.appspot.com",
    messagingSenderId: "254973667568"
};

//open identical firebase account
firebase.initializeApp(config);
// open firevase database
const database = firebase.database();

//---------CRUD Function-----------
function writeAccountData(id, title, type, number, date) {
    //call data by ref
    const accountRef = database.ref('account/' + id);
    //input data into firebase
    accountRef.set({
        title: title,
        type: type,
        number: number,
        date: date
    });
    // 監聽，值有改變時，丟回參數snapshot
    accountRef.on('value', function(snapshot) {
        console.log('success');
        // snapshot.val(); //可以取值
        window.location = '/iSave';
    });
}

function readFormData() {
    // https://kueikuei.github.io/iSave/update.html?id=aa3adf70-5d20-4ae3-9430-dea95a3668c4&title=%E6%B8%AC%E8%A9%A61&type=others&number=999&date=2016-12-10
    // window.location.search;
    // "?id=aa3adf70-5d20-4ae3-9430-dea95a3668c4&title=%E6%B8%AC%E8%A9%A61&type=others&number=999&date=2016-12-10"

    // /iSave/update.html?id=66878e44-f77c-4cab-b5a7-7e3b33a52b5d&title=晚餐&type=eat&number=150&date=2016-12-09
    // ["id=66878e44-f77c-4cab-b5a7-7e3b33a52b5d", "title=%E6%99%9A%E9%A4%90", "type=eat", "number=150", "date=2016-12-09"]
    const params = window.location.search.replace('?', '').split('&');
    console.log(params);
    const addFormRef = document.querySelector("#add-form");
    //Get data by URI, and write into interface 
    //by decodeURI() to analysis to correct words
    addFormRef.title.value = decodeURI(params[1].split('=')[1]);
    addFormRef.type.value = params[2].split('=')[1];
    addFormRef.number.value = params[3].split('=')[1];
    addFormRef.date.value = params[4].split('=')[1];
}

function updateData(id, title, type, number, date) {
    const accountRef = database.ref('account/' + id);
    accountRef.update({
        title: title,
        type: type,
        number: number,
        date: date
    });
    accountRef.on('value', function(snapshot) {
        console.log('success');
        window.location = '/iSave';
    });
}

function deleteData(id) {
    const accountRef = database.ref('account/' + id);
    accountRef.remove();
    accountRef.on('value', function(snapshot) {
        console.log('success');
        window.location = '/iSave';
    });
}
//---------CRUD Function-----------

//---------------Button Listener----------------
// 提交表單就去監聽
//submitType='create'
function submitListener(submitType) {
    // submitType='create' or 'update'
    // add-form取到表單
    const addFormRef = document.querySelector("#add-form");
    addFormRef.addEventListener('submit', function(e) {
        e.preventDefault();//不做原始事情，因為要做Ajax跟資料庫互動
        //cteate identical ID
        const id = uuid.v4();
        // 判斷前端輸入資訊。input中的name去判斷要取出的，最後得到其value存入變數
        const title = addFormRef.title.value;
        const type = addFormRef.type.value;
        const number = addFormRef.number.value;
        const date = addFormRef.date.value;
        if (submitType === 'create') {
            // by writeAccountData() connect to firebase           
            writeAccountData(id, title, type, number, date);
        } else {
            //update data
            const params = window.location.search.replace('?', '').split('&');
            const id = params[0].split('=')[1];
            updateData(id, title, type, number, date);
        }
    });
}

function updateBtnListener() {
    const updateBtns = document.querySelectorAll(".update-btn");//return nodelist
    console.log(updateBtns);
    for (let i = 0; i < updateBtns.length; i++) {
        updateBtns[i].addEventListener('click', function(e) {
            const id = updateBtns[i].getAttribute('data-id');
            e.preventDefault();
            const accountRef = database.ref('account/' + id);
            accountRef.on('value', function(snapshot) {
                window.location = '/iSave/update.html?id=' + id + '&title=' + snapshot.val().title + '&type=' + snapshot.val().type + '&number=' + snapshot.val().number + '&date=' + snapshot.val().date;
            });
        });
    }
}

function deleteBtnListener() {
    const deleteBtns = document.querySelectorAll(".delete-btn");
    console.log(deleteBtns);

    //add eventlistener to all delete button
    for (let i = 0; i < deleteBtns.length; i++) {
        deleteBtns[i].addEventListener('click', function(e) {
            // get data id by delete button
            const id = deleteBtns[i].getAttribute('data-id');
            e.preventDefault();
            if (confirm('確認刪除？')) {
                deleteData(id);
            } else {
                alert('你按下取消');
            }
        });
    }
}
//---------------Button Listener----------------

//----------Reveal on index interface-----------
function readAccountData() {
    let str = `
    <thead>
      <tr>
        <th>消費項目</th>
        <th>消費類別</th>
        <th>消費金額</th>
        <th>消費時間</th>
        <th>操作</th>
      </tr>
    </thead>  
  `;
    const accountRef = database.ref('account/');
    const infoRef = document.querySelector('#data-chart-info');
    const dataTableRef = document.querySelector('#data-table');

    // 一次性讀取資料once
    accountRef.once('value').then(function(snapshot) {
        const data = snapshot.val();
        console.log(data);
        if (data === null) {
            str += '<h4>目前沒有資料喔！</h4>';
            dataTableRef.innerHTML = str;
            infoRef.innerHTML = '<h4>目前沒有資料喔！</h4>';
        } else {
            loadChart(data);
            Object.keys(data).forEach(function(key, index) {
                str +=
                    `
          <tr>
            <td>${data[key].title}</td>
            <td>${data[key].type}</td>
            <td>NT ${data[key].number}</td>
            <td>${data[key].date}</td>
            <td>  
              <button type="button" class="btn btn-primary update-btn" data-id="${key}">編輯</button>
              <button type="button" class="btn btn-danger delete-btn" data-id="${key}">刪除</button>
            </td>
          </tr>
        `;
            });

            document.querySelector('#data-table').innerHTML = str;
            updateBtnListener();
            deleteBtnListener();
        }
    });
}

function loadChart(rawData) {
    let eat = 0;
    let life = 0;
    let play = 0;
    let edu = 0;
    let trafic = 0;
    let others = 0;
    const ctxRef = document.querySelector('#data-chart');
    const infoRef = document.querySelector('#data-chart-info');
    for(const key in rawData) {
      // hasOwnProperty做檢查
      if (rawData.hasOwnProperty(key)) {
        const type = rawData[key].type;
        const number = rawData[key].number;
        switch(type) {
          case 'eat':
            eat += parseInt(number);
            break;
          case 'life':
            life += parseInt(number);
            break;
          case 'play':
            play += parseInt(number);
            break;
          case 'edu':
            edu += parseInt(number);
            break;            
          case 'trafic':
            trafic += parseInt(number);
            break; 
          case 'others':
            others += parseInt(number);
            break; 
        }
      }
    }
    const data = {
        labels: [
            '餐費',
            '生活',
            '娛樂',
            '教育',
            '交通',
            '其他'
        ],
        datasets: [{
            data: [eat, life, play, edu, trafic, others],
            backgroundColor: [
                'rgba(255, 99, 132, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(75, 192, 192, 0.5)',
                'rgba(153, 102, 255, 0.5)',
                'rgba(255, 159, 64, 0.5)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
        }]
    };
    const myPieChart = new Chart(ctxRef, {
        type: 'polarArea',
        data: data,
    });      
}
//----------Reveal on index interface-----------


//----------Route-----------
//得到目前路徑
//http://iSave/create.html
//或http://iSave/update.html
//pathname=/create.html
const path = window.location.pathname;

//routeing製作
switch (path) {
    case '/iSave/create.html':
        submitListener('create');
        break;
    case '/iSave/update.html':
        readFormData();
        submitListener('update');
        break;
    default:
        readAccountData();
}
//----------Route-----------