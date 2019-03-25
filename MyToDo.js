/**
 * Created by ZTR on 6/10/16.
 */
var $ = function (sel) {
    return document.querySelector(sel);
};

var $All = function (sel) {
    return document.querySelectorAll(sel);
};

var makeArray = function (likeArray){
    var array = [];
    for(var i = 0; i < likeArray.length; i++){
        array.push(likeArray[i]);
    }
    return array;
};

function getDateStr(date) {
    return date.getFullYear()+'.'+(date.getMonth()+1)+'.'+date.getDate();
}

function updatePage(itemDate) {
    var data = model.data;
    var itemList = $('#item-list');
    var date = new Date(itemDate);
    var dateStr = getDateStr(date);

    if(!$('#page'+dateStr.split('.').join(''))){
        //------create the time stamp

        // create elements
        var newPage = document.createElement('div');
        newPage.classList.add('item-page');
        newPage.setAttribute('id','page'+dateStr.split('.').join(''));

        var timeStamp = document.createElement('div');
        timeStamp.classList.add('time-stamp');

        var foldMark = document.createElement('div');
        foldMark.classList.add('fold-mark');
        foldMark.innerHTML='❯';

        var dateText = document.createElement('span');
        dateText.innerHTML = dateStr;

        var toggleAll = document.createElement('input');
        toggleAll.setAttribute('type','checkbox');
        toggleAll.classList.add('toggle-all');
        toggleAll.checked = true;
        data.items.forEach(function (iterItem) {
            var iterDate = new Date(iterItem.date);
            var iterDateStr = getDateStr(iterDate);
            if(iterDateStr == dateStr && !iterItem.completed)
                toggleAll.checked = false;
        });

        var newPageList = document.createElement('ul');

        //link together
        timeStamp.appendChild(foldMark);
        timeStamp.appendChild(dateText);
        timeStamp.appendChild(toggleAll);
        newPage.appendChild(timeStamp);
        newPage.appendChild(newPageList);
        itemList.insertBefore(newPage,itemList.firstChild);

        //bind listeners
        foldMark.addEventListener('click',function () {
            if(newPageList.innerHTML == ''){
                newPage.classList.remove('folded');
                var index = data.folded.findIndex(function (iterFolded) {
                    var iterDate = new Date(iterFolded);
                    var iterDateStr = getDateStr(iterDate);
                    return iterDateStr == dateStr;
                });
                data.folded.splice(index,1);
                updatePage(itemDate);
            }
            else{
                data.folded.push(itemDate);
                newPageList.innerHTML = '';
                newPage.classList.add('folded');
            }
            model.flush();
        },false);

        toggleAll.addEventListener('change',function () {
            data.items.forEach(function (iterItem) {
                var iterDate = new Date(iterItem.date);
                var iterDateStr = getDateStr(iterDate);
                if(dateStr != iterDateStr)
                    return;
                iterItem.completed = toggleAll.checked;
            });
            update();
        },false);
    }

    //------fill the list
    if(data.folded.findIndex(function (iterFolded) {
            var iterDate = new Date(iterFolded);
            var iterDateStr = getDateStr(iterDate);
            return iterDateStr == dateStr;
        }) >= 0){
        $('#page'+dateStr.split('.').join('')).classList.add('folded');
        return;
    }

    var currentPageList = $('#page'+dateStr.split('.').join('')+' ul');
    data.items.forEach(function (iterItem, itemIndex) {
        var iterDate = new Date(iterItem.date);
        var iterDateStr = getDateStr(iterDate);

        if(iterDateStr != dateStr)
            return;
        if((data.filter == 'Active' && iterItem.completed)
            || data.filter == 'Completed' && !iterItem.completed)
            return;

        //create elements
        var newItem = document.createElement('li');

        var itemView = document.createElement('div');
        itemView.classList.add('view');

        var contentLb = document.createElement('label');
        contentLb.classList.add('content');
        contentLb.innerHTML = iterItem.msg;

        var toggle = document.createElement('input');
        toggle.classList.add('toggle');
        toggle.setAttribute('type','checkbox');
        if(iterItem.completed){
            contentLb.classList.add('completed');
            toggle.checked = true;
        }
        else{
            contentLb.classList.remove('completed');
            toggle.checked = false;
        }
        
        var destroy = document.createElement('button');
        destroy.classList.add('destroy');
        destroy.innerHTML='X';

        var edit = document.createElement('input');
        edit.classList.add('edit');

        //link together
        itemView.appendChild(contentLb);
        itemView.appendChild(toggle);
        itemView.appendChild(destroy);
        itemView.appendChild(edit);
        newItem.appendChild(itemView);
        currentPageList.insertBefore(newItem,currentPageList.firstChild);

        //bind listeners
        toggle.addEventListener('change',function () {
            iterItem.completed = !iterItem.completed;
            update();
        },false);

        destroy.addEventListener('click',function () {
            data.items.splice(itemIndex,1);
            update();
        },false);

        edit.addEventListener('keyup',function (ev) {
            if(ev.keyCode != 13)
                return;
            contentLb.innerHTML = edit.value;
            data.items[itemIndex].msg = contentLb.innerHTML;
            newItem.classList.remove('editing');
        },false);

        edit.addEventListener('blur',function () {
            newItem.classList.remove('editing');
        },false);

        var startX=0;
        var startY=0;
        var startTime;
        var touchItem = function(event) {
            var event = event || window.event;

            switch(event.type){
                case "touchstart":
                    startX = event.touches[0].pageX;
                    startY = event.touches[0].pageY;
                    startTime = new Date().getTime();
                    break;
                case "touchend":
                    var endX = event.changedTouches[0].pageX;
                    var endY = event.changedTouches[0].pageY;
                    var endTime = new Date().getTime();
                    var time = endTime-startTime;
                    var distance = Math.sqrt((startX-endX)*(startX-endX)+(startY-endY)*(startY-endY));

                    if(time<1000 && distance>20 && Math.abs(startY-endY)<30){
                        if(startX>endX && !newItem.classList.contains('destroyable')){
                            newItem.classList.add('destroyable');
                        }else if(startX<endX && newItem.classList.contains('destroyable')){
                            newItem.classList.remove('destroyable');
                        }
                    }
                    break;
            }
        };

        newItem.addEventListener('touchstart',touchItem,false);
        newItem.addEventListener('touchend',touchItem,false);
        newItem.addEventListener('dblclick',function () {
            newItem.classList.add('editing');
            edit.value = contentLb.innerHTML;
            edit.focus();
        },false);

    });

};

function update() {
    model.flush();
    var data = model.data;

    var itemList = $('#item-list');
    itemList.innerHTML = '';

    var itemLeft = $('#item-left');
    var leftCount = 0;

    var currentDateStr = '';
    data.items.forEach(function (iterItem) {
        var iterDate = new Date(iterItem.date);
        var iterDateStr = getDateStr(iterDate);
        if(!iterItem.completed)
            leftCount++;
        if(iterDateStr != currentDateStr){
            currentDateStr = iterDateStr;
            updatePage(iterItem.date);
        }
    });
    itemLeft.innerHTML = leftCount + (leftCount>1?' items ':' item ') + 'left';
    $('#clear-completed').style.visibility = leftCount<data.items.length?'visible':'hidden';
}

window.onload = function () {
    model.init(function () {
        var data = model.data;

        var addItem = $('#add-item');
        addItem.addEventListener('keyup', function (ev) {
           if(ev.keyCode == 13 && addItem.value != ''){
               var date = new Date();
               data.items.push({msg:addItem.value,completed:false,date:date});
               addItem.value = '';
               update();
            }
            data.msg = addItem.value;
            model.flush();
        },false);

        var clearCompleted = $('#clear-completed');
        clearCompleted.addEventListener('click',function () {
            for(var i = 0; i < data.items.length; i++){
                if(data.items[i].completed){
                    data.items.splice(i,1);
                    i--;
                }
            }
            update();
        },false);

        var filters = makeArray($All('#filters li a'));
        filters.forEach(function (filter) {
            filter.classList.remove('selected');
            if(filter.innerHTML == data.filter)
                filter.classList.add('selected');
            filter.addEventListener('click',function () {
               data.filter = filter.innerHTML;
               filters.forEach(function(filter) {
                   filter.classList.remove('selected');
               });
               filter.classList.add('selected');
               update()
            },false);
        });

        update();

    });
};

window.onscroll = function () {
    var header = $('header');
    var title = $('h1');
    var itemLeft = $('#item-left');
    var addItem = $('#add-item');

    var offset = window.pageYOffset;

    var titleFontSize = (60-offset)<20?20:(60-offset);
    title.style.fontSize = titleFontSize+'px';

    var titleOffsetX = (-(document.body.clientWidth/2+40)/40*offset/2);
    if(titleOffsetX<40-document.body.clientWidth/2)
        titleOffsetX = 40-document.body.clientWidth/2;
    var titleOffsetY = (0.25*offset/2);
    if(titleOffsetY>10)
        titleOffsetY=10;
    title.style.transform = 'translate('+titleOffsetX+'px,'+titleOffsetY+'px)';

    var leftOffsetX = (document.body.clientWidth/2-60)/40*offset/2;
    if(leftOffsetX>document.body.clientWidth/2-60)
        leftOffsetX=document.body.clientWidth/2-60;
    var leftOffsetY = (-15*offset/8);
    if(leftOffsetY<-60)
        leftOffsetY = -60;
    itemLeft.style.transform = 'translate('+leftOffsetX+'px,'+leftOffsetY+'px)';

    var addOffsetY = -15*offset/8;
    if(addOffsetY < -60)
        addOffsetY = -60;
    addItem.style.transform = 'translate(0px,'+addOffsetY+'px)';

    var hdOffset = 15*offset/8;
    if(hdOffset > 60)
        hdOffset = 60;
    header.style.height = (160-hdOffset)+'px';

};

