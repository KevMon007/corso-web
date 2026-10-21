/* CONSULTORIA SANITARIA CORSO - JavaScript */
document.addEventListener('DOMContentLoaded', function () {

  /* Menu Hamburguesa */
  var hamburger = document.querySelector('.hamburger');
  var mobileMenu = document.querySelector('.mobile-menu');
  var mobileLinks = document.querySelectorAll('.mobile-menu a');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });

    mobileLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  /* Header Scroll Shadow */
  var header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 10) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  /* =========================================================
     Formulario de Contacto
     Backend: Netlify Forms (modo por defecto) o Formspree.
     Si el hosting NO es Netlify, cambia FORM_ENDPOINT por la
     URL de tu servicio (ej. 'https://formspree.io/f/XXXXXX').
     ========================================================= */
  var FORM_ENDPOINT = '';

  var formulario = document.getElementById('contactForm');
  if (formulario) {
    var formStart = Date.now();
    var msgBox = document.getElementById('formMensaje');
    var btnEnviar = document.getElementById('btnEnviar');

    var CAMPOS = [
      { el: 'nombre', err: 'error-nombre', vacio: 'Escribe tu nombre completo.' },
      { el: 'email', err: 'error-email', vacio: 'Escribe tu correo electronico.', invalido: 'Revisa que el correo tenga el formato: nombre@dominio.com' },
      { el: 'telefono', err: 'error-telefono', vacio: 'Escribe tu numero de telefono.', invalido: 'El telefono solo admite numeros, espacios y los signos + - ( ).' },
      { el: 'mensaje', err: 'error-mensaje', vacio: 'Escribe tu mensaje.' },
      { el: 'consentimiento', err: 'error-consentimiento', vacio: 'Debes aceptar los Terminos y Condiciones y el Aviso de Privacidad.', check: true }
    ];

    function mostrarMensaje(texto, tipo) {
      if (!msgBox) return;
      msgBox.textContent = texto;
      msgBox.className = 'form-mensaje ' + (tipo || 'error');
      msgBox.hidden = false;
    }

    function limpiarMensaje() {
      if (!msgBox) return;
      msgBox.textContent = '';
      msgBox.hidden = true;
    }

    function limpiarErrores() {
      CAMPOS.forEach(function (c) {
        var campo = document.getElementById(c.el);
        if (campo) campo.classList.remove('error');
        var span = document.getElementById(c.err);
        if (span) span.textContent = '';
      });
    }

    function marcarError(campo, span, texto) {
      if (campo) campo.classList.add('error');
      if (span) span.textContent = texto;
    }

    /* Devuelve el primer campo con problema, o null si todo esta bien */
    function validar() {
      var primerError = null;

      CAMPOS.forEach(function (c) {
        var campo = document.getElementById(c.el);
        var span = document.getElementById(c.err);
        if (!campo) return;

        /* Casilla de consentimiento: se valida marcada, no por texto */
        if (c.check) {
          if (!campo.checked) {
            marcarError(campo, span, c.vacio);
            if (!primerError) primerError = campo;
          } else {
            campo.classList.remove('error');
            if (span) span.textContent = '';
          }
          return;
        }

        var valor = campo.value.trim();

        if (valor === '') {
          marcarError(campo, span, c.vacio);
          if (!primerError) primerError = campo;
          return;
        }

        if (c.el === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor)) {
          marcarError(campo, span, c.invalido);
          if (!primerError) primerError = campo;
          return;
        }

        if (c.el === 'telefono' && !/^[\d\s\-()+]{7,}$/.test(valor)) {
          marcarError(campo, span, c.invalido);
          if (!primerError) primerError = campo;
          return;
        }

        campo.classList.remove('error');
        if (span) span.textContent = '';
      });

      return primerError;
    }

    formulario.addEventListener('submit', function (e) {
      e.preventDefault();

      // Campo trampa: si viene relleno es un bot, no le damos ninguna senal
      var botField = formulario.querySelector('[name="bot-field"]');
      if (botField && botField.value !== '') return;

      limpiarErrores();
      limpiarMensaje();

      var primerError = validar();
      if (primerError) {
        mostrarMensaje('Revisa los campos marcados para poder enviar tu mensaje.');
        primerError.focus();
        return;
      }

      // Antispam: ningun humano llena el formulario en menos de 3 segundos
      if (Date.now() - formStart < 3000) {
        mostrarMensaje('El formulario se envio demasiado rapido. Intentalo de nuevo en unos segundos.');
        return;
      }

      var url = FORM_ENDPOINT || '/';

      if (btnEnviar) {
        btnEnviar.disabled = true;
        btnEnviar.textContent = 'Enviando...';
      }

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(formulario)).toString()
      })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          if (btnEnviar) {
            btnEnviar.disabled = false;
            btnEnviar.textContent = 'Mensaje enviado';
          }
          mostrarMensaje('Gracias, ya recibimos tu mensaje. Te contactaremos muy pronto.', 'ok');
          formulario.reset();
          setTimeout(function () { window.location.href = 'gracias.html'; }, 1200);
        })
        .catch(function () {
          if (btnEnviar) {
            btnEnviar.disabled = false;
            btnEnviar.textContent = 'Enviar Mensaje';
          }
          mostrarMensaje('No pudimos enviar tu mensaje. Escribenos a regulacionsanitariacorso@gmail.com o llamanos al 5652767256.');
        });
    });
  }

  /* Video: sonido y pausa cuando no esta en pantalla */
  var video = document.getElementById('corsoVideo');
  var soundToggle = document.getElementById('soundToggle');

  if (video) {
    // Los navegadores bloquean el autoplay con sonido: se arranca mudo
    video.muted = true;

    if (soundToggle) {
      soundToggle.addEventListener('click', function () {
        var silenciado = !video.muted;
        video.muted = silenciado;
        soundToggle.setAttribute('aria-pressed', String(!silenciado));
        soundToggle.innerHTML = silenciado
          ? '<span aria-hidden="true">&#9834;</span> Activar sonido'
          : '<span aria-hidden="true">&#9834;</span> Silenciar';
        // Es un gesto del usuario: reproduce aunque el navegador bloquee el autoplay
        var play = video.play();
        if (play && typeof play.catch === 'function') {
          play.catch(function () { /* no se pudo reproducir */ });
        }
      });
    }

    // Click sobre el video: reproducir / pausar
    video.addEventListener('click', function () {
      if (video.paused) {
        var play = video.play();
        if (play && typeof play.catch === 'function') {
          play.catch(function () { /* no se pudo reproducir */ });
        }
      } else {
        video.pause();
      }
    });

    // Pausar el video fuera de pantalla: ahorra CPU y bateria en movil
    if ('IntersectionObserver' in window) {
      var videoObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var play = video.play();
            if (play && typeof play.catch === 'function') {
              play.catch(function () { /* autoplay bloqueado por el navegador */ });
            }
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.25 });
      videoObserver.observe(video);
    }
  }

});
