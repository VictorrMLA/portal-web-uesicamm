const API_URL = "https://script.google.com/macros/s/AKfycbzI6Oj6v69w-kP1XEUwA6JGIGaPo5tZev5Pxpcc8rJ8uL6_cVWJR8s2YfN5oDiOTpTC/exec"; 

document.addEventListener('DOMContentLoaded', () => {
  
  const contenedorPrincipal = document.getElementById('app-root');
  const carrusel = document.getElementById('carrusel');

  // 1. CONTROLADOR DE VISTAS (MVC DINÁMICO SPA)
  async function navegarA(vistaId) {
    if (!vistaId || vistaId === '') vistaId = 'inicio';
    
    if (carrusel) {
      carrusel.style.display = (vistaId === 'inicio') ? 'block' : 'none';
    }

    try {
      const nombreArchivo = `page_${vistaId}.html`;
      const res = await fetch(nombreArchivo);
      
      if (res.ok) {
        contenedorPrincipal.innerHTML = await res.text();
        
        if (vistaId === 'soporte') {
          inicializarFormularioSoporte();
        }
      } else {
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
    
    const navCollapse = document.getElementById('menuNavegacion');
    if (navCollapse && navCollapse.classList.contains('show')) {
      const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
      if (bsCollapse) bsCollapse.hide();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 2. INTERCEPCIÓN DE CLICS Y RUTEO EN LA URL
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-vista]');
    if (link) {
      e.preventDefault();
      const vista = link.getAttribute('data-vista');
      window.location.hash = vista;
      navegarA(vista);
    }
  });

  function procesarHash() {
    const hash = window.location.hash.replace('#', '');
    navegarA(hash || 'inicio');
  }

  window.addEventListener('hashchange', procesarHash);
  procesarHash();

  // 3. ENVÍO DE FORMULARIO A LA API DE GOOGLE APPS SCRIPT
  function inicializarFormularioSoporte() {
    const formSoporte = document.querySelector('form');
    
    if (formSoporte) {
      formSoporte.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = formSoporte.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Enviando...`;

        const inputs = formSoporte.querySelectorAll('input, select, textarea');
        const datos = {
          nombre: inputs[0].value,
          curp: inputs[1].value,
          proceso: inputs[2].value,
          correo: inputs[3].value,
          incidencia: inputs[4].value
        };

        try {
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

  // 4. CARRUSEL ADAPTATIVO
  const track = document.getElementById('trackCarrusel');
  if (track) {
    const slides = Array.from(track.children);
    const btnNext = document.getElementById('btnNext');
    const btnPrev = document.getElementById('btnPrev');
    const indicadoresContainer = document.getElementById('indicadores');
    let currentIndex = 0;

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

    setInterval(() => {
      if (track.offsetParent !== null) {
        moveToSlide(currentIndex + 1);
      }
    }, 5000);
  }

  // 5. MODAL INSTANCIA BOOTSTRAP
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
