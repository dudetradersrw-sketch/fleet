function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetNames = ["Contacts", "Trucks", "Trailers", "Combinations", "Drivers", "Garage", "Monitoring", "Containers", "Invoices", "Expenses", "Users", "Trips"];
  var data = {};
  
  sheetNames.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (sheet) {
      var rows = sheet.getDataRange().getValues();
      if (rows.length > 0) {
        var rawHeaders = rows[0];
        var headers = rawHeaders.map(function(h) {
          return String(h).trim().replace(/\s+/g, '');
        });
        var list = [];
        for (var i = 1; i < rows.length; i++) {
          var obj = {};
          for (var j = 0; j < headers.length; j++) {
            obj[headers[j]] = rows[i][j];
          }
          list.push(obj);
        }
        data[name] = list;
      } else {
        data[name] = [];
      }
    } else {
      data[name] = [];
    }
  });

  var jsonString = JSON.stringify(data);
  var callback = e && e.parameter && e.parameter.callback;
  
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + jsonString + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    return ContentService.createTextOutput(jsonString)
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
  }
}

function doPost(e) {
  return handleRequest(e, "POST");
}

function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function handleRequest(e, method) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetNames = ["Contacts", "Trucks", "Trailers", "Combinations", "Drivers", "Garage", "Monitoring", "Containers", "Invoices", "Expenses", "Users", "Trips"];
  
  try {
    if (method === "POST") {
      var payload = JSON.parse(e.postData.contents);
      var sheetName = payload.sheet;
      var action = payload.action;
      var data = payload.data;
      
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({status: "error", message: "Sheet not found: " + sheetName}))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeader("Access-Control-Allow-Origin", "*");
      }
      
      var rows = sheet.getDataRange().getValues();
      var rawHeaders = rows.length > 0 ? rows[0] : [];
      var headers = rawHeaders.map(function(h) {
        return String(h).trim().replace(/\s+/g, '');
      });
      
      if (sheetName === "Users") {
        if (action === "add") {
          var userId = data.ID || "USR-" + Date.now().toString().slice(-4);
          sheet.appendRow([userId, data.Username, data.Password, data.Category, JSON.stringify(data.Permissions), data.Name]);
          return ContentService.createTextOutput(JSON.stringify({status: "success"}))
            .setMimeType(ContentService.MimeType.JSON)
            .setHeader("Access-Control-Allow-Origin", "*");
        } else if (action === "update") {
          var targetId = String(data.ID);
          for (var i = 1; i < rows.length; i++) {
            if (String(rows[i][0]) === targetId) {
              sheet.getRange(i + 1, 1, 1, 6).setValues([[
                targetId, 
                data.Username || rows[i][1], 
                data.Password || rows[i][2], 
                data.Category || rows[i][3], 
                JSON.stringify(data.Permissions) || rows[i][4], 
                data.Name || rows[i][5]
              ]]);
              break;
            }
          }
          return ContentService.createTextOutput(JSON.stringify({status: "success"}))
            .setMimeType(ContentService.MimeType.JSON)
            .setHeader("Access-Control-Allow-Origin", "*");
        } else if (action === "delete") {
          for (var i = 1; i < rows.length; i++) {
            if (String(rows[i][0]) === String(data.id)) {
              sheet.deleteRow(i + 1);
              break;
            }
          }
          return ContentService.createTextOutput(JSON.stringify({status: "success"}))
            .setMimeType(ContentService.MimeType.JSON)
            .setHeader("Access-Control-Allow-Origin", "*");
        }
      }
      
      if (action === "add") {
        var newRow = rawHeaders.map(function(h) {
          var cleanH = String(h).trim().replace(/\s+/g, '');
          if (cleanH === "ID") return data[cleanH] || ("FD-" + Date.now().toString().slice(-4));
          if (cleanH === "Status" && !data[cleanH]) return "Loaded";
          return data[cleanH] !== undefined ? data[cleanH] : "";
        });
        sheet.appendRow(newRow);
        return ContentService.createTextOutput(JSON.stringify({status: "success"}))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeader("Access-Control-Allow-Origin", "*");
      }
      
      if (action === "update") {
        var targetId = String(data.ID);
        for (var i = 1; i < rows.length; i++) {
          if (String(rows[i][0]) === targetId) {
            var updatedRow = rawHeaders.map(function(h, j) {
              var cleanH = String(h).trim().replace(/\s+/g, '');
              if (cleanH === "ID") return targetId;
              return data[cleanH] !== undefined ? data[cleanH] : rows[i][j];
            });
            sheet.getRange(i + 1, 1, 1, updatedRow.length).setValues([updatedRow]);
            break;
          }
        }
        return ContentService.createTextOutput(JSON.stringify({status: "success"}))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeader("Access-Control-Allow-Origin", "*");
      }
      
      if (action === "delete") {
        for (var i = 1; i < rows.length; i++) {
          if (String(rows[i][0]) === String(data.id)) {
            sheet.deleteRow(i + 1);
            break;
          }
        }
        return ContentService.createTextOutput(JSON.stringify({status: "success"}))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeader("Access-Control-Allow-Origin", "*");
      }
      
      if (action === "archive") {
        var statusColIndex = headers.indexOf("Status");
        if (statusColIndex !== -1) {
          for (var i = 1; i < rows.length; i++) {
            if (String(rows[i][0]) === String(data.id)) {
              sheet.getRange(i + 1, statusColIndex + 1).setValue("Archived");
              break;
            }
          }
        }
        return ContentService.createTextOutput(JSON.stringify({status: "success"}))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeader("Access-Control-Allow-Origin", "*");
      }
    }
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
  }
}