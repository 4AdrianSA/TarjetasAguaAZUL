const inputsHoras = document.querySelectorAll('.input-horas');
const celdaTotal =document.getElementById('total-horas');

// funcion que hace la suma
function calcularSumaHoras() {
    let sumaTotal = 0;
    //Recorremos cadro por cuadro hacer la suma 
    inputsHoras.forEach( input =>{
        let valor = parseFloat(input.value)||0;
        sumaTotal += valor ;

    });

   

    

    celdaTotal.textContent = sumaTotal;
}

  inputsHoras.forEach(casilla => {
       casilla.addEventListener('input', calcularSumaHoras);
   });

// Jugada A: Localizamos el botón y toda la ficha en la pantalla
const botonPdf = document.getElementById('btn-generar-pdf');
// Tu 'body' o el contenedor principal es lo que se convertirá en PDF
const elementoAImprimir = document.body; 

// Jugada B: Le ponemos un guardia al botón que escuche el "click"
botonPdf.addEventListener('click', () => {
    
    // Cambiar colores temporalmente para el PDF
    document.body.style.color = '#000000';
    document.body.style.backgroundColor = '#ffffff';

    const opciones = {
        margin:       10,
        filename:     'Ficha_Registro_Publicador.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opciones).from(elementoAImprimir).save().then(() => {
        // Restaurar colores originales después de generar el PDF
        document.body.style.color = '';
        document.body.style.backgroundColor = '';
    });
});


const btnGuardar = document.getElementById('btn-guardar');

btnGuardar.addEventListener('click',() =>{

    const nombre = document.getElementById('input-nombre').value;
    if (!nombre){
        alert ('Escribe el nombre del publicador');
        return
    }
    const ficha = {
        id:Date.now(),
        nombre:nombre,
        fechaNacimiento:document.getElementById('input-fecha-nacimiento').value,
        fechaBautismo:document.getElementById('fecha-de-bautismo').value,
        anioServicio:document.getElementById('input-anio').value,
        cargo:document.querySelector('input[name="privilegio"]:checked')?.value || '',
        grupoNumero: document.getElementById('input-grupo-numero'),value,
        rolGrupo:document.querySelector('input[name="rol-grupo"]:cheked')?.value|| ''
};
let lista = JSON (localStorage.getItem('publicadores')) || [];

//paso 6
alert('Guardado'+ nombre);
document.getElementById('input-nombre').value = '';
document.getElementById('input-fecha-nacimiento').value = '';
document.getElementById('fecha-de-bautismo').value = '';
document.getElementById('input-anio').value = '';
document.getElementById('input-grupo-numero').value = '';
document.querySelectorAll('input[name="privilegio"], input[name="genero"],input[name="grupo"],input[name="rol-grupo"]').forEach(cb => cb.checked=false);

})