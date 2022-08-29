//set a global var db// create variable to hold db connection
let db;

// establish a connection to IndexedDB database called 'budget' and set it to version 1
const request = indexedDB.open('budget', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event) {
      // save a reference to the database 
	db = event.target.result;
        // create an object store (table) called `new_transaction`, set it to have an auto incrementing primary key of sorts 
	db.createObjectStore('new_transaction', { autoIncrement: true });
};

//upon a successful
request.onsuccess = function(event) {
        // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
	db = event.target.result;
	if (window.navigator.onLine) {
		console.log('window online now ');
		checkIndexdb();
	}
};

request.onerror = function(event) {
    // log error here
	console.log(event.target.error);
};

  // This function will be executed if we attempt to submit a new transaction and there's no internet connection
function saveRecord(record) {
	// open a new transaction with the database with read and write permissions 
	const transaction = db.transaction('new_transaction', 'readwrite');
	//access the objectStore
	const store = transaction.objectStore('new_transaction');
	//add record to the store
	store.add(record);
}

//get record
function checkIndexdb() {
	//open a transaction on the db
	const transaction = db.transaction('new_transaction', 'readwrite');
	//access the objectStore
	const store = transaction.objectStore('new_transaction');
	//get all records from the store and send to the server
	const getAll = store.getAll();

	console.log(getAll);

    //If getAll is successful, then POST the records
	getAll.onsuccess = function() {
		if (getAll.result.length > 0) {
			fetch('/api/transaction/bulk', {
				method: 'POST',
				body: JSON.stringify(getAll.result),
				headers: {
					Accept: 'application/json, text/plain, */*',
					'Content-Type': 'application/json'
				}
			})
				.then(response => response.json())
				.then(() => {
					//clear indexdb store after successful POST
					const transaction = db.transaction([ 'new_transaction' ], 'readwrite');
					// access object store
					const store = transaction.objectStore('new_transaction');
					// clear all items in object store
					store.clear();
				});
		}
	};
};

//listen for app coming back online
window.addEventListener('online', checkIndexdb);