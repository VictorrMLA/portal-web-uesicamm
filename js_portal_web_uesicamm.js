// =======================================================================
// CONFIGURACIÓN DE LA API (Reemplaza con tu URL real de Google Apps Script)
// =======================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbzI6Oj6v69w-kP1XEUwA6JGIGaPo5tZev5Pxpcc8rJ8uL6_cVWJR8s2YfN5oDiOTpTC/exec"; 

document.addEventListener('DOMContentLoaded', () => {
  
  const contenedorPrincipal = document.getElementById('app-root');
  const carrusel = document.getElementById('carrusel');

  // =======================================================================
  // 1. CONTROLADOR DE VISTAS (MVC DINÁMICO SPA)
  // =======================================================================
  async function navegarA(vistaId) {
    if (!vistaId || vistaId === '') vistaId = 'inicio';
    
    // 1.1 Ocultar carrusel si no estamos en inicio
    if (carrusel) {
      carrusel.style.display = (vistaId === 'inicio') ? 'block' : 'none';
    }

    try {
      // 1.2 Fetch para descargar e inyectar el HTML de la página solicitada
      const nombreArchivo = `page_${vistaId}.html`;
      const res = await fetch(nombreArchivo);
      
      if (res.ok) {
        contenedorPrincipal.innerHTML = await res.text();
        
        // 1.3 Si la vista que se abrió fue "soporte", activar el listener del formulario
        if (vistaId === 'soporte') {
          inicializarFormularioSoporte();
        }
      } else {
        // Manejo de Error 404
        contenedorPrincipal.innerHTML = `
          <div class="text-center my-5">
            <h2 class="texto-guinda fw-bold">Error 404</h2>
            <p class="fs-5">La sección que buscas no existe o está en mantenimiento.</p>
          </div>
        `;
      }
    } catch (error) {
      console.error("Error al cargar la vista:", error);
      contenedorPrincipal.innerHTML = `
        <div class="text-center my-5">
          <h2 class="texto-guinda fw-bold">Error de Conexión</h2>
          <p class="fs-5">No se pudo cargar el contenido. Verifica tu conexión a internet.</p>
        </div>
      `;
    }
    
    // 1.4 Autocolapsar menú hamburguesa en móviles al hacer clic en un enlace
    const navCollapse = document.getElementById('menuNavegacion');
    if (navCollapse && navCollapse.classList.contains('show')) {
      const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
      if (bsCollapse) bsCollapse.hide();
    }
    
    // 1.5 Subir el scroll de la página hasta arriba de forma fluida
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // =======================================================================
  // 2. INTERCEPCIÓN DE CLICS Y RUTEO EN LA URL
  // =======================================================================
  
  // Escuchar clics en los enlaces con el atributo data-vista
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-vista]');
    if (link) {
      e.preventDefault();
      const vista = link.getAttribute('data-vista');
      window.location.hash = vista; // Cambia la URL en el navegador
      navegarA(vista); // Ejecuta el controlador
    }
  });

  // Sincronizar el Hash de la URL (Por si el usuario usa las flechas de Retroceso/Avance del navegador)
  function procesarHash() {
    const hash = window.location.hash.replace('#', '');
    navegarA(hash || 'inicio');
  }

  window.addEventListener('hashchange', procesarHash);
  
  // Carga inicial al entrar al dominio por primera vez
  procesarHash();


  // =======================================================================
  // 3. ENVÍO DE FORMULARIO A LA API DE GOOGLE APPS SCRIPT
  // =======================================================================
  function inicializarFormularioSoporte() {
    const formSoporte = document.querySelector('form');
    
    if (formSoporte) {
      formSoporte.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = formSoporte.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Enviando...`;

        // Capturar los valores de los inputs usando querySelectorAll
        const inputs = formSoporte.querySelectorAll('input, select, textarea');
        const datos = {
          nombre: inputs[0].value,
          curp: inputs[1].value,
          proceso: inputs[2].value, // El select
          correo: inputs[3].value,
          incidencia: inputs[4].value // El textarea
        };

        try {
          // Enviar la petición POST al backend (Apps Script) en modo no-cors
          await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
          });
          
          alert('¡Ticket de soporte registrado correctamente! Nos comunicaremos con usted al correo proporcionado.');
          formSoporte.reset();
        } catch (error) {
          console.error(error);
          alert('Ocurrió un error al enviar el ticket. Intente nuevamente más tarde.');
        } finally {
          btn.disabled = false;
          btn.textContent = originalText;
        }
      });
    }
  }


  // =======================================================================
  // 4. CAMBIO DE TEMA (CLARO / OSCURO)
  // =======================================================================
  const htmlElement = document.documentElement;
  const btnTema = document.getElementById('btnTema');
  const temaGuardado = localStorage.getItem('temaPortalUESICAMM');
  
  if (temaGuardado) htmlElement.setAttribute('data-theme', temaGuardado);

  if (btnTema) {
    btnTema.addEventListener('click', () => {
      const temaActual = htmlElement.getAttribute('data-theme');
      const nuevoTema = temaActual === 'light' ? 'dark' : 'light';
      htmlElement.setAttribute('data-theme', nuevoTema);
      localStorage.setItem('temaPortalUESICAMM', nuevoTema);
    });
  }


  // =======================================================================
  // 5. CARRUSEL ADAPTATIVO
  // =======================================================================
  const track = document.getElementById('trackCarrusel');
  if (track) {
    const slides = Array.from(track.children);
    const btnNext = document.getElementById('btnNext');
    const btnPrev = document.getElementById('btnPrev');
    const indicadoresContainer = document.getElementById('indicadores');
    let currentIndex = 0;

    // Crear los puntitos (indicadores)
    if (indicadoresContainer && indicadoresContainer.children.length === 0) {
      slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => moveToSlide(index));
        indicadoresContainer.appendChild(dot);
      });
    }

    function updateDots() {
      if (!indicadoresContainer) return;
      const dots = Array.from(indicadoresContainer.children);
      dots.forEach(dot => dot.classList.remove('active'));
      if (dots[currentIndex]) dots[currentIndex].classList.add('active');
    }

    function moveToSlide(index) {
      if (index < 0) currentIndex = slides.length - 1;
      else if (index >= slides.length) currentIndex = 0;
      else currentIndex = index;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
      updateDots();
    }

    if (btnNext) btnNext.addEventListener('click', () => moveToSlide(currentIndex + 1));
    if (btnPrev) btnPrev.addEventListener('click', () => moveToSlide(currentIndex - 1));

    // Autoplay del carrusel cada 5 segundos (solo si está visible)
    setInterval(() => {
      if (track.offsetParent !== null) {
        moveToSlide(currentIndex + 1);
      }
    }, 5000);
  }


  // =======================================================================
  // 6. MODAL INSTANCIA BOOTSTRAP (Aviso Institucional)
  // =======================================================================
  
  // Delegación de eventos (Event Delegation) para capturar el botón incluso si
  // fue inyectado dinámicamente en page_inicio.html
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'btnAbrirModal') {
      const modalElement = document.getElementById('exampleModal');
      if (modalElement) {
        const modalInstance = new bootstrap.Modal(modalElement);
        modalInstance.show();
      }
    }
  });

});
