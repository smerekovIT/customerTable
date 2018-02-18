$(function() {
var baseUrl = 'http://5a85a7b1085fdd00127042ad.mockapi.io/customers';
var $customerRegistration = $('.customerRegistration')
var $submitBtn = $('#submitBtn')

var itemTemplate = $('#itemTemplate').html();
//значение
var $name = $('#name')
var $surname = $('#surname')
var $menedger = $('#menedger')
var $idCustomer = $('#id-customer')
var $ordersCount = $('#ordersCount')
var $moneySpent = $('#moneySpent')
var $newOrderCount = $('#newOrderCount')
//обработчики
var $tableBody = $('#tableBody')
var $buyerTable = $('#buyerTable')
var $buyerRequestForm = $('#buyerRequestForm')
var $actionForm = $('#actionForm')


$buyerRequestForm
	.on('change', onFormChange)
	.on('submit', onFormSubmit)

$tableBody
	.on('click', '.upgrade-btn', onEditBtnClick)
	.on('click', '.delete-btn', onDeleteClick)
	.on('click', '.order-btn', onOrderFormClick)

$buyerTable.click(sortTableRows)	

$actionForm.click(activateTableByClick)	
init()

	

//СОРТИРОВКА ТАБЛИЦЫ 
function sortTableRows(event) {
	if(event.target.tagName != 'TH') return
		
	sortGrid(event.target.cellIndex , event.target.dataset.type)	
}

function sortGrid(colNum, type) {
	var tbody = $('tbody')[0];
	var rowsArray = [].slice.call(tbody.rows)
	var compare;
	switch(type) {
		case 'number':
		compare = function(rowA, rowB) {
			return rowB.cells[colNum].innerHTML - rowA.cells[colNum].innerHTML
		};
		break;
		case 'string':
		compare = function(rowA, rowB) {
			console.log(rowA.cells[colNum].innerHTML, rowB.cells[colNum].innerHTML)
			return rowA.cells[colNum].innerHTML > rowB.cells[colNum].innerHTML
		};
		break;
	}

	rowsArray.sort(compare);
	for(var i = 0; i < rowsArray.length; i++) {
		tbody.append(rowsArray[i])
	}
	
};


//
function activateTableByClick() {
	$buyerRequestForm.show('fold', 1000)
	$buyerTable.hide('drop', {direction:'down'}, 'slow')
}

////ЗАПРОС
function request(method, uri, data) {
	return $.ajax(baseUrl + uri, {
		method: method,
		data: data,
	})
}




////Валидность формы
function onFormChange() {
checkFormValid()
}

function checkFormValid() {
	if(isFormvalid()) {
		enableButton();
	} else {
		disableButton();
	};
};

function isFormvalid() {
	let result = true;
	$customerRegistration.each(function() {
		var $input = $(this);
		result = !!$input.val();

		return result;
	});
	return result

};

function enableButton() {
$submitBtn.removeAttr('disabled');
};

function disableButton() {
	$submitBtn.attr('disabled', 'disabled');
}

////конец Валидность формы

function onFormSubmit(event) {
	event.preventDefault()
	$buyerRequestForm.hide('drop', {direction:'down'}, 'slow')
	$buyerTable.show('fold', 1000)
	var customer = {
		id: $idCustomer.val(),
		manager: $menedger.val(),
		name: $name.val(),
		surname: $surname.val()
		
	};
	
	setCustomer(customer);
	clearForm();
	

}

function setCustomer(customer) {
	if(customer.id){
	 updateServerData(customer) 
	} else {
	 createDataOnServer(customer)
	}
}





function updateServerData(customer) {
	var $tr = $(`[data-id='${customer.id}']`);
	request('PUT', `/${customer.id}`, customer).then(function(data) {
		$tr.replaceWith(createItemElement(data))
	})
}

function createDataOnServer(customer) {
	customer.createdAt = new Date().toDateString();
	customer.moneySpent = 0;
	customer.ordersCount = 0;
	 request('POST', '/', customer)
	 	.then(function(data) {
	 		$tableBody.append(createItemElement(data))			
	 	})
}

///
function onDeleteClick() {
	
	var id = $(this).closest('tr').data('id');
	request('DELETE', `/${id}`).then(function(data) {
		$tableBody.find(`tr[data-id=${data.id}]`).remove();
	})
}


//Заполнить форму для изменения
function  onEditBtnClick() {
	$buyerRequestForm.show('fold', 1000)
	$buyerTable.hide('drop', {direction:'down'}, 'slow')
	var id = $(this).closest('tr').data('id');
	fillForm(id)
};

function fillForm(id) {
	request('GET', `/${id}`, {})
	.then(function(data) {
		$idCustomer.val(data.id)
		$name.val(data.name)
		$surname.val(data.surname)
		$menedger.val(data.manager)
		$ordersCount.val(data.moneySpent)
		$moneySpent.val(data.ordersCount)
		checkFormValid()
		})
	
};


function createItemElement(data) {
	var row = itemTemplate
	 		.replace('{{id}}', data.id)
	 		.replace('{{manager}}', data.manager)
			.replace('{{name}}', data.name)
			.replace('{{surname}}', data.surname)
			.replace('{{createdAt}}', data.createdAt)
			.replace('{{moneySpent}}', data.moneySpent)
			.replace('{{ordersCount}}', data.ordersCount);
	return row;
};



function init() {
	request('GET', '/', {}).then(function(data) {
		for(var i in data){
			$tableBody.append(createItemElement(data[i]))
		};
	});
};



//Очистка форм
function clearForm() {
	$name.val('');
	$surname.val('');
	$menedger.val('');
	$idCustomer.val('');
	$ordersCount.val('');
	$moneySpent.val('');
	$newOrderCount.val('');
};



function onOrderFormClick() {
	var id = $(this).closest('tr').data('id');
	request('GET', `/${id}`, {}).then(function(data){
			$idCustomer.val(data.id)
			$ordersCount.val(data.ordersCount)
			$moneySpent.val(data.moneySpent)
			dialog.dialog('open')
    })
};

///Модульное окно 
var dialog = $('#formOrder').dialog({
	autoOpen: false,
	height: 400,
	width: 350,
	modal: true,
	buttons: {
		'Заказать': addOrderModuleClick,
		'Отмена': closeModuleWindow
	}
});

function closeModuleWindow() {
	dialog.dialog('close')
	clearForm()
}


function addOrderModuleClick() {
	event.preventDefault()

	var id = $idCustomer.val()
	var order = 1;
	var addNumberOfOrders =  +$ordersCount.val() + order;
	var addAmount = +$moneySpent.val() + +$newOrderCount.val()

	var data = `moneySpent=${addAmount}&ordersCount=${addNumberOfOrders}`;

sendOrderFormToServer(id, data)	
closeModuleWindow()
};

function sendOrderFormToServer(id, data) {
var $tr = $(`[data-id='${id}']`);
var $tdMoney = $tr.find(`td[data-type='class-moneySpent']`);
var $tdOrder = $tr.find(`td[data-type='class-ordersCount']`);
request('PUT', `/${id}`, data)
			.then(function(data) {
				$tdMoney.text(data.moneySpent)
				$tdOrder.text(data.ordersCount)
		
			})
};

});