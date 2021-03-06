dbQueries = {};

dbQueries.getBooks = function(connPool, callback) {
    connPool.query('SELECT * FROM books', callback);
}

dbQueries.getBooksWithReservations = function(connPool, callback) {
  var sqlQuery =
  'SELECT books.id, books.title, books.author, books.owner, books.summary, reservations.id as reservation_id, reservations.name, reservations.from_date, reservations.to_date FROM books LEFT JOIN reservations ON books.id=reservations.book_id ORDER BY reservations.from_date;';
  var booksWithReservations = {};
  connPool.query(sqlQuery, function(err, dbResult) {
    if (err) {
      return callback(err);
    }
    var results = dbResult.rows;
    results.forEach(function(result) {
      // add new books if not already there
      if (!booksWithReservations[result.id]) {
        var bookObj = {
          id: result.id,
          title: result.title,
          author: result.author,
          owner: result.owner,
          summary: result.summary,
          reservations: [],
          isAvailable: true
        };
        booksWithReservations[result.id] = bookObj;
      }
      // now add reservation if there
      if (result.reservation_id) {
        var reservationInfo = {
          id: result.reservation_id,
          name: result.name,
          from_date: result.from_date,
          to_date: result.to_date
        };

        // check if reservation covers todays date
        var today = Date.now();
        var fromDate = (new Date(result.from_date)).getTime();
        var toDate = (new Date(result.to_date)).getTime();
        if (today > fromDate && today < toDate) {
          booksWithReservations[result.id].isAvailable = false;
        }

        // add reservation
        booksWithReservations[result.id].reservations.push(reservationInfo);
      }
    });
    // convert to array
    var booksWithReservationsArr = [];
    for (var key in booksWithReservations) {
      booksWithReservationsArr.push(booksWithReservations[key]);
    }
    callback(null, booksWithReservationsArr);
  });
}

dbQueries.insertBook = function(connPool, parsedData, callback) {
    connPool.query(
        'INSERT INTO books (title, author, owner, summary) VALUES ($1, $2, $3, $4)',
        [parsedData.title, parsedData.author, parsedData.owner, parsedData.summary],
        callback
    );
}

module.exports = dbQueries;
