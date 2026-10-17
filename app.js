<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FleetDesk - Port Clearing & Logistics</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="app.js"></script>
</head>
<body class="bg-gray-100 font-sans flex h-screen overflow-hidden">
  <div id="sidebarContainer"></div>
  <main class="flex-1 flex flex-col h-screen overflow-y-auto">
    <header class="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
      <h1 class="text-xl font-bold text-gray-800">Port Clearing Operations</h1>
      <button onclick="fetchDatabase(true)" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm transition">🔄 Sync Data</button>
    </header>
    <div class="p-6 space-y-6" id="pageContent">Loading...</div>
  </main>

  <script>
    document.getElementById("sidebarContainer").innerHTML = renderSidebar("Clearing");

    window.onDataLoaded = function(db) {
      db = db || {};
      const clearingList = db.Clearing || [];
      const columns = ["ID", "ContainerNo", "BLno", "Consignee", "Client", "Size", "Port", "Destination", "ETA", "Transporter", "Truck", "Clearing ($)", "Transport ($)", "Storage ($)", "Actions"];

      let tableRows = "";
      clearingList.forEach(item => {
        const hasAttachment = item.AttachmentData && item.AttachmentData.length > 0;
        tableRows += `
          <tr class="hover:bg-gray-50 border-b cursor-pointer" onclick="previewClearingDetails('${item.ID}')">
            <td class="p-3 text-xs text-gray-500 font-mono">${item.ID || ''}</td>
            <td class="p-3 font-bold text-gray-800">📦 ${item.ContainerNo || ''} ${hasAttachment ? '📎' : ''}</td>
            <td class="p-3 text-xs text-blue-600">${item.BLno || ''}</td>
            <td class="p-3 text-xs">${item.Consignee || ''}</td>
            <td class="p-3 font-semibold text-indigo-700">${item.Client || ''}</td>
            <td class="p-3 text-xs">${item.Size || ''}</td>
            <td class="p-3 text-xs">${item.Port || ''}</td>
            <td class="p-3 text-xs">${item.Destination || ''}</td>
            <td class="p-3 text-xs">${item.ETA || ''}</td>
            <td class="p-3 text-xs">${item.Transporter || ''}</td>
            <td class="p-3 text-xs">${item.Truck || ''}</td>
            <td class="p-3 font-semibold text-blue-600">$${parseFloat(item.ClearingAmount || 0).toFixed(2)}</td>
            <td class="p-3 font-semibold text-emerald-600">$${parseFloat(item.TransportAmount || 0).toFixed(2)}</td>
            <td class="p-3 font-semibold text-red-600">$${parseFloat(item.StorageAmount || 0).toFixed(2)}</td>
            <td class="p-3 text-center" onclick="event.stopPropagation()">
              ${renderActionCell('Clearing', item.ID)}
            </td>
          </tr>
        `;
      });

      document.getElementById("pageContent").innerHTML = `
        <div class="mb-2 flex justify-between items-center">
          <button onclick="openClearingFormModal()" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition">
            ➕ Add Port Clearing File
          </button>
        </div>
        <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div class="p-4 border-b flex flex-col md:flex-row justify-between items-center gap-3">
            <input type="text" placeholder="🔍 Search clearing files..." oninput="filterTable(event, 'table_Clearing')" class="border px-3 py-1.5 rounded text-sm w-full md:w-72 outline-none">
            <div class="flex items-center gap-2">
              ${renderColumnVisibilityMenu('table_Clearing', columns)}
              <button onclick="exportPDFTable('Clearing', globalData.Clearing || [])" class="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm font-semibold">📥 PDF</button>
              <button onclick="exportCSVData('Clearing', globalData.Clearing || [])" class="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-semibold">📥 CSV</button>
            </div>
          </div>
          <div class="overflow-x-auto min-h-[300px]">
            <table class="w-full text-left border-collapse text-sm whitespace-nowrap" id="table_Clearing">
              <thead>
                <tr class="bg-gray-50 text-gray-500 text-xs">
                  <th class="p-3">ID</th>
                  <th class="p-3">ContainerNo</th>
                  <th class="p-3">BLno</th>
                  <th class="p-3">Consignee</th>
                  <th class="p-3">Client</th>
                  <th class="p-3">Size</th>
                  <th class="p-3">Port</th>
                  <th class="p-3">Destination</th>
                  <th class="p-3">ETA</th>
                  <th class="p-3">Transporter</th>
                  <th class="p-3">Truck</th>
                  <th class="p-3">Clearing ($)</th>
                  <th class="p-3">Transport ($)</th>
                  <th class="p-3">Storage ($)</th>
                  <th class="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                ${tableRows || '<tr><td colspan="15" class="p-4 text-center text-gray-400">No clearing files found. Click "Add Port Clearing File" to start.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;
    };

    let attachedFileBase64 = "";
    let attachedFileName = "";

    function triggerFileInput() {
      const fileInput = document.getElementById("hiddenClearingFileInput");
      if (fileInput) fileInput.click();
    }

    function handleFileAttachment(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      attachedFileName = file.name;
      const displaySpan = document.getElementById("attachedFileNameDisplay");
      if (displaySpan) {
        displaySpan.innerText = "Selected: " + attachedFileName;
        displaySpan.className = "text-xs text-emerald-600 font-semibold truncate max-w-[220px]";
      }

      const reader = new FileReader();
      reader.onload = function(uploadEvent) {
        attachedFileBase64 = uploadEvent.target.result;
        showNotification("File attached successfully!");
      };
      reader.readAsDataURL(file);
    }

    function openClearingFormModal(item = null) {
      const db = globalData || {};
      const contacts = db.Contacts || [];
      const combinations = db.Combinations || [];
      const trucks = db.Trucks || [];

      const ports = ["Port of Dar es Salaam", "Port of Mombasa", "Kigali ICD (Magarum)", "Rusumo Dry Port"];
      const destinations = ["Kigali, Rwanda", "Goma, DRC", "Bukavu, DRC", "Bujumbura, Burundi", "Kampala, Uganda"];

      attachedFileBase64 = item ? (item.AttachmentData || "") : "";
      attachedFileName = item ? (item.AttachmentName || "") : "";

      const editId = item ? item.ID : '';
      const html = `
        <form onsubmit="submitClearingForm(event)" class="space-y-4 max-h-[75vh] overflow-y-auto px-1">
          <input type="hidden" id="cl_edit_id" value="${editId}">

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="text-xs text-gray-500 block mb-1 font-semibold">Container No</label>
              <input type="text" id="cl_container" value="${item ? item.ContainerNo || '' : ''}" required class="border p-2 rounded w-full text-sm outline-none">
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1 font-semibold">BL No</label>
              <input type="text" id="cl_bl" value="${item ? item.BLno || '' : ''}" required class="border p-2 rounded w-full text-sm outline-none">
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1 font-semibold">Size</label>
              <select id="cl_size" class="border p-2 rounded w-full text-sm outline-none bg-white">
                <option value="20ft" ${item && item.Size === '20ft' ? 'selected' : ''}>20ft</option>
                <option value="40ft" ${item && item.Size === '40ft' ? 'selected' : ''}>40ft</option>
                <option value="45ft" ${item && item.Size === '45ft' ? 'selected' : ''}>45ft</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-gray-500 block mb-1 font-semibold">Consignee</label>
              <input type="text" id="cl_consignee" value="${item ? item.Consignee || '' : ''}" required class="border p-2 rounded w-full text-sm outline-none">
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1 font-semibold">Client</label>
              <input type="text" id="cl_client" value="${item ? item.Client || '' : ''}" required class="border p-2 rounded w-full text-sm outline-none">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-gray-500 block mb-1 font-semibold">Port</label>
              <input type="text" id="cl_port" list="portsList" value="${item ? item.Port || '' : ''}" placeholder="Select or type port" required class="border p-2 rounded w-full text-sm outline-none">
              <datalist id="portsList">
                ${ports.map(p => `<option value="${p}">`).join('')}
              </datalist>
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1 font-semibold">Destination</label>
              <input type="text" id="cl_destination" list="destList" value="${item ? item.Destination || '' : ''}" placeholder="Select or type destination" required class="border p-2 rounded w-full text-sm outline-none">
              <datalist id="destList">
                ${destinations.map(d => `<option value="${d}">`).join('')}
              </datalist>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-lg border">
            <div>
              <label class="text-xs text-gray-500 block mb-1">Received Docs On</label>
              <input type="date" id="cl_recDocs" value="${item ? item.RecDocs || '' : ''}" class="border p-1.5 rounded w-full text-xs outline-none bg-white">
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1">Sent to Agent On</label>
              <input type="date" id="cl_sentAgent" value="${item ? item.SentAgent || '' : ''}" class="border p-1.5 rounded w-full text-xs outline-none bg-white">
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1">ETA</label>
              <input type="date" id="cl_eta" value="${item ? item.ETA || '' : ''}" class="border p-1.5 rounded w-full text-xs outline-none bg-white">
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1">Vessel Offloaded On</label>
              <input type="date" id="cl_offloaded" value="${item ? item.Offloaded || '' : ''}" class="border p-1.5 rounded w-full text-xs outline-none bg-white">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border">
            <div>
              <label class="text-xs text-gray-500 block mb-1">Storage On</label>
              <input type="date" id="cl_storageDate" value="${item ? item.StorageDate || '' : ''}" class="border p-1.5 rounded w-full text-xs outline-none bg-white">
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1">Loaded On (Truck)</label>
              <input type="date" id="cl_loadedDate" value="${item ? item.LoadedDate || '' : ''}" class="border p-1.5 rounded w-full text-xs outline-none bg-white">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-gray-500 block mb-1 font-semibold">Transporter</label>
              <input type="text" id="cl_transporter" list="transporterList" value="${item ? item.Transporter || '' : ''}" placeholder="Select or type transporter" class="border p-2 rounded w-full text-sm outline-none">
              <datalist id="transporterList">
                ${contacts.map(c => `<option value="${c.Name || c.Company || c.ID}">`).join('')}
              </datalist>
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1 font-semibold">Truck</label>
              <input type="text" id="cl_truck" list="truckList" value="${item ? item.Truck || '' : ''}" placeholder="Select or type truck plate" class="border p-2 rounded w-full text-sm outline-none">
              <datalist id="truckList">
                ${trucks.map(t => `<option value="${t.PlateNumber || t.ID}">`).join('')}
              </datalist>
            </div>
          </div>

          <div class="border-t pt-3 space-y-3">
            <h3 class="font-bold text-gray-700 text-sm">Client Agent & Shipping Lines</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label class="text-xs text-gray-500 block mb-1">Agent Full Name / Company</label>
                <input type="text" id="cl_agentName" value="${item ? item.AgentName || '' : ''}" class="border p-2 rounded w-full text-sm outline-none">
              </div>
              <div>
                <label class="text-xs text-gray-500 block mb-1">Agent Tel</label>
                <input type="text" id="cl_agentTel" value="${item ? item.AgentTel || '' : ''}" class="border p-2 rounded w-full text-sm outline-none">
              </div>
              <div>
                <label class="text-xs text-gray-500 block mb-1">Agent Email</label>
                <input type="email" id="cl_agentEmail" value="${item ? item.AgentEmail || '' : ''}" class="border p-2 rounded w-full text-sm outline-none">
              </div>
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1">Shipping Line(s)</label>
              <input type="text" id="cl_shippingLines" value="${item ? item.ShippingLines || '' : ''}" placeholder="e.g. MSC, Maersk, CMA CGM (comma separated)" class="border p-2 rounded w-full text-sm outline-none">
            </div>
          </div>

          <div class="border-t pt-3 space-y-3">
            <h3 class="font-bold text-gray-700 text-sm">Financials & Charge Breakdown Logs</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-5 gap-2">
              <div>
                <label class="text-xs text-gray-500 block mb-1">Clearing ($)</label>
                <input type="number" step="0.01" id="cl_clearingAmt" value="${item ? item.ClearingAmount || 0 : 0}" class="border p-2 rounded w-full text-sm outline-none">
              </div>
              <div>
                <label class="text-xs text-gray-500 block mb-1">Transport ($)</label>
                <input type="number" step="0.01" id="cl_transportAmt" value="${item ? item.TransportAmount || 0 : 0}" class="border p-2 rounded w-full text-sm outline-none">
              </div>
              <div>
                <label class="text-xs text-gray-500 block mb-1">Storage ($)</label>
                <input type="number" step="0.01" id="cl_storageAmt" value="${item ? item.StorageAmount || 0 : 0}" class="border p-2 rounded w-full text-sm outline-none">
              </div>
              <div>
                <label class="text-xs text-gray-500 block mb-1">Rent ($)</label>
                <input type="number" step="0.01" id="cl_rentAmt" value="${item ? item.RentAmount || 0 : 0}" class="border p-2 rounded w-full text-sm outline-none">
              </div>
              <div>
                <label class="text-xs text-gray-500 block mb-1">Demurrage ($)</label>
                <input type="number" step="0.01" id="cl_demurrageAmt" value="${item ? item.DemurrageAmount || 0 : 0}" class="border p-2 rounded w-full text-sm outline-none">
              </div>
            </div>

            <div class="space-y-2 bg-gray-50 p-3 rounded-lg border">
              <label class="text-xs font-bold text-gray-700 block">📝 Charge Notes & Chronological Process Logs</label>
              <div>
                <span class="text-xs text-gray-500 block">Storage Charge Log / Description:</span>
                <textarea id="cl_storageNotes" rows="2" placeholder="Record why storage accrued..." class="border p-2 rounded w-full text-xs outline-none bg-white">${item ? item.StorageNotes || '' : ''}</textarea>
              </div>
              <div>
                <span class="text-xs text-gray-500 block">Warehouse Rent Charge Log / Description:</span>
                <textarea id="cl_rentNotes" rows="2" placeholder="Record custom warehouse rent details..." class="border p-2 rounded w-full text-xs outline-none bg-white">${item ? item.RentNotes || '' : ''}</textarea>
              </div>
              <div>
                <span class="text-xs text-gray-500 block">Demurrage / Detention Charge Log / Description:</span>
                <textarea id="cl_demurrageNotes" rows="2" placeholder="Record demurrage/detention timelines..." class="border p-2 rounded w-full text-xs outline-none bg-white">${item ? item.DemurrageNotes || '' : ''}</textarea>
              </div>
            </div>

            <!-- File Attachment Section -->
            <div class="border-t pt-3">
              <label class="text-xs font-bold text-gray-700 block mb-1">📎 Attach Document (BL, Invoice, Receipt, etc.)</label>
              <div class="flex items-center gap-3">
                <input type="file" id="hiddenClearingFileInput" onchange="handleFileAttachment(event)" class="hidden">
                <button type="button" onclick="triggerFileInput()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow transition flex items-center gap-2">
                  <span>📁 Choose File</span>
                </button>
                <span id="attachedFileNameDisplay" class="text-xs text-gray-600 font-medium truncate max-w-[240px]">
                  ${attachedFileName ? 'Selected: ' + attachedFileName : 'No file chosen'}
                </span>
              </div>
            </div>
          </div>

          <button type="submit" class="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition">
            ${item ? 'Update Clearing File' : 'Save Clearing File'}
          </button>
        </form>
      `;

      openFormModal(item ? `Edit Clearing File: ${item.ContainerNo}` : "New Port Clearing File", html);
    }

    async function submitClearingForm(e) {
      e.preventDefault();
      const editId = document.getElementById("cl_edit_id").value;
      const transporterName = document.getElementById("cl_transporter").value.trim();

      if (transporterName) {
        const db = globalData || {};
        const contacts = db.Contacts || [];
        const exists = contacts.some(c => String(c.Name || c.Company).toLowerCase() === transporterName.toLowerCase());
        if (!exists) {
          const newContact = {
            ID: "CON-" + Date.now().toString().slice(-4),
            Name: transporterName,
            Category: "Transporter",
            Phone: document.getElementById("cl_agentTel").value || ""
          };
          await sendToServer("Contacts", "add", newContact);
        }
      }

      const data = {
        ID: editId || ("CLR-" + Date.now().toString().slice(-4)),
        ContainerNo: document.getElementById("cl_container").value,
        BLno: document.getElementById("cl_bl").value,
        Size: document.getElementById("cl_size").value,
        Consignee: document.getElementById("cl_consignee").value,
        Client: document.getElementById("cl_client").value,
        Port: document.getElementById("cl_port").value,
        Destination: document.getElementById("cl_destination").value,
        RecDocs: document.getElementById("cl_recDocs").value,
        SentAgent: document.getElementById("cl_sentAgent").value,
        ETA: document.getElementById("cl_eta").value,
        Offloaded: document.getElementById("cl_offloaded").value,
        StorageDate: document.getElementById("cl_storageDate").value,
        LoadedDate: document.getElementById("cl_loadedDate").value,
        Transporter: transporterName,
        Truck: document.getElementById("cl_truck").value,
        AgentName: document.getElementById("cl_agentName").value,
        AgentTel: document.getElementById("cl_agentTel").value,
        AgentEmail: document.getElementById("cl_agentEmail").value,
        ShippingLines: document.getElementById("cl_shippingLines").value,
        ClearingAmount: document.getElementById("cl_clearingAmt").value,
        TransportAmount: document.getElementById("cl_transportAmt").value,
        StorageAmount: document.getElementById("cl_storageAmt").value,
        RentAmount: document.getElementById("cl_rentAmt").value,
        DemurrageAmount: document.getElementById("cl_demurrageAmt").value,
        StorageNotes: document.getElementById("cl_storageNotes").value,
        RentNotes: document.getElementById("cl_rentNotes").value,
        DemurrageNotes: document.getElementById("cl_demurrageNotes").value,
        AttachmentData: attachedFileBase64,
        AttachmentName: attachedFileName
      };

      await sendToServer("Clearing", editId ? "update" : "add", data);
    }

    function previewClearingDetails(id) {
      const item = (globalData.Clearing || []).find(x => String(x.ID) === String(id));
      if (!item) return alert("Record not found.");

      const total = (parseFloat(item.ClearingAmount) || 0) + 
                    (parseFloat(item.TransportAmount) || 0) + 
                    (parseFloat(item.StorageAmount) || 0) + 
                    (parseFloat(item.RentAmount) || 0) + 
                    (parseFloat(item.DemurrageAmount) || 0);

      const attachmentSection = item.AttachmentData ? `
        <div class="bg-indigo-50 p-3 rounded-lg border border-indigo-200 flex justify-between items-center">
          <span class="text-xs font-bold text-indigo-900">📎 Attached Document: ${item.AttachmentName || 'Document'}</span>
          <a href="${item.AttachmentData}" download="${item.AttachmentName || 'Clearing_Attachment'}" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-semibold shadow transition">Download File</a>
        </div>
      ` : `<div class="bg-gray-50 p-2 rounded text-xs text-gray-400 italic">No document attached to this clearing file.</div>`;

      const modalHtml = `
        <div id="printableClearingContent" class="space-y-3 text-sm text-gray-700 bg-white p-1">
          <div class="flex justify-between border-b pb-1"><span class="font-medium text-gray-500">Container No:</span><span class="font-bold text-gray-900">📦 ${item.ContainerNo}</span></div>
          <div class="flex justify-between border-b pb-1"><span class="font-medium text-gray-500">BL No / Size:</span><span class="font-semibold">${item.BLno} (${item.Size})</span></div>
          <div class="flex justify-between border-b pb-1"><span class="font-medium text-gray-500">Consignee / Client:</span><span class="font-semibold">${item.Consignee} / ${item.Client}</span></div>
          <div class="flex justify-between border-b pb-1"><span class="font-medium text-gray-500">Port & Destination:</span><span class="font-semibold">${item.Port} ➔ ${item.Destination}</span></div>
          <div class="flex justify-between border-b pb-1"><span class="font-medium text-gray-500">Transporter / Truck:</span><span class="font-semibold text-indigo-600">${item.Transporter || 'N/A'} (${item.Truck || 'N/A'})</span></div>
          <div class="flex justify-between border-b pb-1"><span class="font-medium text-gray-500">Shipping Line(s):</span><span class="font-semibold">${item.ShippingLines || 'N/A'}</span></div>
          
          ${attachmentSection}

          <div class="bg-slate-50 p-3 rounded-lg border space-y-1">
            <p class="font-bold text-xs uppercase text-slate-700">💰 Financial Breakdown</p>
            <div class="flex justify-between text-xs"><span>Clearing Amount:</span><span class="font-semibold">$${parseFloat(item.ClearingAmount || 0).toFixed(2)}</span></div>
            <div class="flex justify-between text-xs"><span>Transport Amount:</span><span class="font-semibold">$${parseFloat(item.TransportAmount || 0).toFixed(2)}</span></div>
            <div class="flex justify-between text-xs"><span>Storage Amount:</span><span class="font-semibold text-red-600">$${parseFloat(item.StorageAmount || 0).toFixed(2)}</span></div>
            <div class="flex justify-between text-xs"><span>Warehouse Rent:</span><span class="font-semibold text-red-600">$${parseFloat(item.RentAmount || 0).toFixed(2)}</span></div>
            <div class="flex justify-between text-xs"><span>Demurrage/Detention:</span><span class="font-semibold text-red-600">$${parseFloat(item.DemurrageAmount || 0).toFixed(2)}</span></div>
            <div class="flex justify-between text-xs border-t pt-1 font-bold text-gray-950"><span>Total Expenses:</span><span>$${total.toFixed(2)}</span></div>
          </div>

          <div class="bg-gray-50 p-3 rounded-lg border space-y-2">
            <p class="font-bold text-xs uppercase text-gray-700">📝 Charge Logs & Notes</p>
            <div><span class="font-semibold text-xs text-gray-600">Storage Log:</span> <p class="text-xs text-gray-800 bg-white p-1.5 rounded border mt-0.5">${item.StorageNotes || 'No notes recorded.'}</p></div>
            <div><span class="font-semibold text-xs text-gray-600">Warehouse Rent Log:</span> <p class="text-xs text-gray-800 bg-white p-1.5 rounded border mt-0.5">${item.RentNotes || 'No notes recorded.'}</p></div>
            <div><span class="font-semibold text-xs text-gray-600">Demurrage / Detention Log:</span> <p class="text-xs text-gray-800 bg-white p-1.5 rounded border mt-0.5">${item.DemurrageNotes || 'No notes recorded.'}</p></div>
          </div>
        </div>
      `;

      document.getElementById("modalTitle").innerHTML = `
        <div class="flex justify-between items-center w-full">
          <span>Clearing File: ${item.ContainerNo}</span>
          <button onclick="printClearingModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition flex items-center gap-1">
            🖨️ Print / Download PDF
          </button>
        </div>
      `;
      document.getElementById("modalBody").innerHTML = modalHtml;
      document.getElementById("previewModal").classList.remove("hidden");
    }

    function printClearingModal() {
      const printContents = document.getElementById("printableClearingContent").innerHTML;
      const originalContents = document.body.innerHTML;

      document.body.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: auto;">
          <h2 style="text-align: center; color: #1e3a8a; margin-bottom: 5px;">FLEETDESK - PORT CLEARING REPORT</h2>
          <p style="text-align: center; font-size: 12px; color: #6b7280; margin-bottom: 20px;">Generated on: ${new Date().toLocaleString()}</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin-bottom: 20px;" />
          ${printContents}
        </div>
      `;

      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }

    window.onEditTriggered = function(sheetName, item) {
      if (sheetName === 'Clearing') openClearingFormModal(item);
    };

    fetchDatabase();
  </script>
</body>
</html>
