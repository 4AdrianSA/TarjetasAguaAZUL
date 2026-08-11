// utils.js — Funciones compartidas entre app.js y meses.js

var nombresMeses = ['Septiembre','Octubre','Noviembre','Diciembre','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto'];
var abbr = {'Septiembre':'Sep','Octubre':'Oct','Noviembre':'Nov','Diciembre':'Dic','Enero':'Ene','Febrero':'Feb','Marzo':'Mar','Abril':'Abr','Mayo':'May','Junio':'Jun','Julio':'Jul','Agosto':'Ago'};

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function mostrarToast(mensaje, tipo) {
    var toast = document.createElement('div');
    toast.textContent = mensaje;
    toast.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:12px 20px;border-radius:6px;color:#fff;font-size:14px;font-weight:bold;z-index:9999;box-shadow:0 2px 8px rgba(0,0,0,0.3);transition:opacity 0.3s;';
    toast.style.background = tipo === 'error' ? '#f7768e' : '#9ece6a';
    document.body.appendChild(toast);
    setTimeout(function() { toast.style.opacity = '0'; }, 2000);
    setTimeout(function() { document.body.removeChild(toast); }, 2300);
}

// Firebase / Firestore
var db = null;
var usaFirebase = false;
var cacheLista = [];
var cacheSolicitudes = [];

try {
    if (typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined' && firebaseConfig.apiKey !== 'TU_API_KEY_AQUI') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        usaFirebase = true;
    }
} catch(e) { console.log('Firebase no disponible:', e); }

function cargarLista() {
    return cacheLista.filter(function(f) { return f && f.nombre; });
}

function guardarLista(lista) {
    cacheLista = lista.filter(function(f) { return f && f.nombre; });
    localStorage.setItem('publicadores', JSON.stringify(cacheLista));
    guardarSolicitudes(cacheSolicitudes);
}

function cargarSolicitudes() {
    return cacheSolicitudes;
}

function guardarSolicitudes(solicitudes) {
    cacheSolicitudes = solicitudes.filter(function(s) { return s && s.id; });
    localStorage.setItem('solicitudes', JSON.stringify(cacheSolicitudes));
    if (usaFirebase && db) {
        db.collection('publicadores').doc('datos').set({
            lista: cacheLista,
            solicitudes: cacheSolicitudes,
            fechaGuardado: new Date().toISOString()
        }).catch(function(err) { console.error('Error Firestore:', err); });
    }
    if (typeof canal !== 'undefined') canal.postMessage('actualizar');
}

function cargarDatosIniciales(callback) {
    if (usaFirebase && db) {
        db.collection('publicadores').doc('datos').get().then(function(doc) {
            if (doc.exists && doc.data().lista) {
                cacheLista = doc.data().lista;
                cacheSolicitudes = doc.data().solicitudes || (JSON.parse(localStorage.getItem('solicitudes')) || []);
            } else {
                cacheLista = (JSON.parse(localStorage.getItem('publicadores')) || []).filter(function(f) { return f && f.nombre; });
                cacheSolicitudes = (JSON.parse(localStorage.getItem('solicitudes')) || []).filter(function(s) { return s && s.id; });
                if (cacheLista.length > 0) guardarLista(cacheLista);
            }
            callback();
        }).catch(function(err) {
            console.error('Error Firestore:', err);
            cacheLista = (JSON.parse(localStorage.getItem('publicadores')) || []).filter(function(f) { return f && f.nombre; });
            cacheSolicitudes = (JSON.parse(localStorage.getItem('solicitudes')) || []).filter(function(s) { return s && s.id; });
            callback();
        });
    } else {
        cacheLista = (JSON.parse(localStorage.getItem('publicadores')) || []).filter(function(f) { return f && f.nombre; });
        cacheSolicitudes = (JSON.parse(localStorage.getItem('solicitudes')) || []).filter(function(s) { return s && s.id; });
        callback();
    }
}
