const fechaData = new Date(); /* obtiene la fecha */

const $btnSend = $("#btnSend"); /* En la laerta para confirmar un envio, es el botón para aceptar "Si, Enviar" */
const $dlgDeposit = $("#dlgDeposit"); /* Es la alerta que muestra los datos de un depósito efectuado "(monto) depositado correctamente" */
const $btnConfirm = $("#btnConfirm"); /* Una vez el contacto ya está seleccionado y se indicó el monto a enviar, este es el botón para Enviar, que despliega la alerta de confirmación */
const $dlgUser = $("#dlgUser"); /* Alerta estandarizada, para indicar que hay que seleccionar contacto, tanto para enviar como eliminar, indicar un saldo válido o que el saldo es insuficiente */
const $goSend = $("#goSend"); /* Es el botón "Entendido" dentro de las alertas dlgUser */
const $goDeposit = $("#goDeposit"); /* Es el botón "Entendido" dentro de dlgDeposit */
const $goCompleted = $("#goCompleted"); /* Botón "Entendido" dentro de la alerta que indica (monto) enviado a (contacto) correctamente */

const $contactoModal = $("#contactoModal input"); /* Modal que contiene el formulario para agregar Contacto */
const $cancelForm = $("#cancelForm"); /* Botón "Cancelar" del formulario para añadir contacto */
const $closeForm = $("#closeForm"); /* "X" para cerrar el formulario para ñadir contacto */

const $inputAmount = $("#inputAmount"); /* Input para ingresar el monto a enviar */
const $historyList = $("#historyList"); /* Lista que contien historial de transacciones */
const $dlgHistorial = $("#dlgHistorial"); /* Alerta para confirmar la eliminación del historial */

let saldoChartInstance = null; /* El gráfico, variación del saldo en el tiempo */

const $saldo = $("#saldo"); /* Contenedor para visualizar el saldo */
const $entra = $(".entra"); /* Diferenciador del submit de los depósitos */
const $sale = $(".sale"); /* Diferenciador del submit de los envios */

const $filtroTipo = $("#filtroTipo"); /* Select donde se indica el tipo de transacción que quiere verse en el historial */
const $historyClean = $("#historyClean"); /* Botón para limpiar el historial */

let nuevoSaldo = "0"; /* Declaración inicial del saldo, antes de cualquier transacción o carga de datos */
let COBRO_SERVICIO = 500; /* Declaración del costo servicio */
let MAX_HISTORY = 5; /* Declaración de la canidad de transacciones que se quiere ver por página en el historial */


/* Cerrar alerta confirmación de envio */
$goSend.on("click", function () {
    hideAlert($dlgUser);
});
/* Cerrar alerta depósito completado */
$goDeposit.on("click", function () {
    hideAlert($dlgDeposit);
    window.location.href = "../pages/menu.html"; /* Redirige al menú al completar un depósito */
});
/* Cerrar alerta envio completado */
$goCompleted.on("click", function () {
    hideAlert($dlgDeposit);
    window.location.href = "../pages/menu.html"; /* Redirige al menú al completar un envio */
});

function mostrarLeyenda($btn) { /* Función recibe un botón */
    const $leyenda = $("<div>") /* Crea un elemento div */
        .text(`Redirigiendo a ${$btn.data("title")}...`) /* extrae el data-title del botón */
        .addClass("leyenda-sesion") /* Agrega elementos del .css */
    $("body").append($leyenda); /* Añade el elemento recien creaco al body de la página */

    // Forzar reflow, calcula para reiniciar animación
    void $leyenda[0].offsetWidth;

    // Aplicar animación de entrada
    $leyenda.addClass("leyenda-entering");

    // Remover clase al terminar y esperar 4 segundos extra en el centro
    const animationEnd = function () { /* Declara función animatioEnd */
        $leyenda.removeClass("leyenda-entering");
        $leyenda.off("animationend", animationEnd);

        // Esperar 4 segundos adicionales en el centro antes de salir
        setTimeout(function () {
            $leyenda.addClass("leyenda-exiting");
        }, 4000);
    };

    $leyenda.on("animationend", animationEnd); /* Al percibir evento nativo animatioend, ejecuta función animationEnd declarada antes */
}

function getUsuarioActivo() { /* Declara función */
    const id = sessionStorage.getItem("usuarioActivo"); /* Obtiene el usuario activo, es un id */
    if (!id) return null;

    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || []; /* Obtiene el array completo de usuarios */
    return usuarios.find(u => u.id === Number(id)) || null; /* Obtiene el asuario que calza con el id */
};

function verificarSesion() {
    const idUsuario = sessionStorage.getItem("usuarioActivo"); /* obtiene usuario activo, que es el id del usuario que ingresó, definido desde login.js */

    if (!idUsuario) { /* Si no detecta la sesión activa */
        window.location.href = "../index.html"; /* redirige al inicio, se llamará esta función al ingresar a cada página, menos index o login */
        return false;
    }

    return true;
}

function cargarHistorial(filtro = "Todos", pagina = 1) { /* Declara función, recibe filtro y página */
    if (!$historyList.length) return; /* Verifica elemento contactList, en transactions.html es una lista */

    const usuario = getUsuarioActivo(); /* Obtiene el usuario */
    if (!usuario) return;

    let movimientos = usuario.historial || []; /* Extrae solo el historial del usuario */

    if (filtro !== "Todos") { /* Si el filtro no es "todos" obtiene la clave tipo del historial y lo aplica como filtro */
        movimientos = movimientos.filter(m => m.tipo === filtro); /* Para ver solo los movimientos de cierto tipo */
    }

    movimientos = movimientos.slice().reverse(); /* Crea un array copia, para no alterar el original, luego se revierte para ver los elementos más recientes primero */

    const total = movimientos.length; /* Total de elementos que pasan el filtro */
    const inicio = (pagina - 1) * MAX_HISTORY; /* Número del elemento de inicio de cada página */
    const visibles = movimientos.slice(inicio, inicio + MAX_HISTORY); /* Los elementos visbles van de "inicio" (determinado por página), hasta el último (inicio + cantidad de elementos que se van a ver) */

    $historyList.empty(); /* Limpia los elementos previos de la lista antes de cargarla */

    if (visibles.length === 0) { /* Si no hay elementos que mostrar queda indicado */
        $historyList.append(`
            <li class="list-group-item text-muted text-center">
                No hay movimientos
            </li>
        `);
    } else {
        $.each(visibles, function (_, mov) { /* Estructura html con que se muestran los elementos visibles del historial */
            $historyList.append(`
            <li class="list-group-item py-1">
                <div class="d-flex justify-content-between">
                    <strong>${mov.cliente}</strong>
                    <span class="${mov.monto >= 0 ? 'text-success' : 'text-danger'}">
                        ${mov.monto >= 0 ? '+' : '-'}$${Math.abs(mov.monto)}
                    </span>
                </div>
                <div class="small text-muted">
                    ${mov.detalle}
                </div>
                <div class="small text-muted text-end">
                    ${mov.fecha}
                </div>
            </li>
        `);
        });
    }

    $("#prevPage").prop("disabled", pagina === 1); /* En la primera página no funciona botón "anterior" */
    $("#nextPage").prop("disabled", inicio + MAX_HISTORY >= total); /* Si el ultimo elemeto de la página es el último del todo, botón "siguiente" no funciona */
}

function guardarUsuario(usuarioActualizado) { /* Declara función, recibe datos de usuario en un array */
    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || []; /* Carga el array total de usuarios */

    const index = usuarios.findIndex(u => u.id === usuarioActualizado.id); /* El usuario actualizado parte del usuario activo, asi que tiene su id, el cual usa para encontrar el usuario a actualizar */
    if (index === -1) return;

    usuarios[index] = usuarioActualizado; /* Carga el usuario actualizado sobre el usuario en el array */
    localStorage.setItem("usuarios", JSON.stringify(usuarios)); /* Actualiza el JSON (localStorage) con el array anterior pero como un string JSON */
}

function buscarUsuarioPorCuenta(numeroCuentaAlke) { /* Declara función, recibe la clave numeroCuentaAlke del usuario/contacto */
    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    return usuarios.find(u => u.numeroCuentaAlke === Number(numeroCuentaAlke)) || null; /* Entrega el usuario que tenga el numeroCuentaAlke buscado */
}

$(document).ready(function () {

    const $btnDeposit = $("#btnDeposit"); /* Botón "Realizar depósito en el formulario para depositar" */
    const $amount = $("#amount"); /* Input para ingresar el monto a depositar */
    const $dlgDepositData = $("#dlgDepositData"); /* Contenido (texto) de la alerta de depósito completado "(monto) depositado correctamente" */

    if ($btnDeposit.length && $amount.length) { /* Confirma que hay botón y un input con el monto */
        $btnDeposit.on("click", function (e) { /* detecta click en el botón */
            e.preventDefault(); /* evita el comportamiento por default, el submit */

            const monto = Number($amount.val()); /* Convierte el input del monto (string) en un dato numérico */

            if (monto <= 0) { /* Asegura que el monto a depositar sea positivo, de no ser asi vacia el input */
                $amount.val("");
                return;
            }

            const usuario = getUsuarioActivo(); /* Entrega el usuario con el id del usuario activo */
            const saldoActual = usuario.saldo || 0; /* Obtiene la clave saldo del usuario */
            const nuevoSaldo = saldoActual + monto; /* Declara el nuevo saldo obtenido tras la operación */
            usuario.saldo = nuevoSaldo; /* Actualiza el saldo del usuario */

            usuario.historial = usuario.historial || []; /* Se asegura de no entregar un valor que genere errores (Undefined, null...) */

            usuario.historial.push({ /* Carga datos al historial del usuario */
                cliente: "Propio",
                monto: monto,
                fecha: new Date().toLocaleDateString("es-CL"),
                tipo: "Depósito",
                detalle: `+$${monto}`
            });

            guardarUsuario(usuario); /* Le carga al usuario, el usuario actualizado y lo manda al localStorage */

            $amount.val(""); /* Limpia el input */
            $saldo.val(nuevoSaldo); /* Actualiza el mostrador de saldo */

            $dlgDepositData.text(`$${monto} depositados correctamente.`); /* Define el contenido de la alerta al cmpletar un depósito */
            showAlert($dlgDeposit, 3000); /* Despliega alerta y espera 3 segundos antes de retirarla */

            setTimeout(function () { /* Espera 3 segundos antes de redirigir de vuelta al menú */
                window.location.href = "../pages/menu.html";
            }, 3000);
        });
    }
});

$(document).ready(function () { /* Función estandar para todos los botones con clase surf */
    const $btnSurf = $(".surf");

    $btnSurf.on("click", function (e) { /* Detecta el click en el botón */
        e.preventDefault(); /* Previene comportamiento por default (redirige a cierta página)*/

        const $btn = $(this); /* Declara el mismo botón */

        mostrarLeyenda($btn); /* Le aplica función mostrarLeyenda: Extrae data-title, lo utiliza para crear contenido de la alerta y mostrarla */

        setTimeout(function () {
            // Obtener la leyenda que se acaba de crear
            const $leyenda = $(".leyenda-sesion").last();

            // Aplicar animación de salida
            $leyenda.removeClass("leyenda-entering").addClass("leyenda-exiting");

            // Redirigir después de que termine la animación de salida
            $leyenda.one("animationend", function () {
                window.location.href = $btn.attr("href");
            });
        }, 1000); // Espera un segundo, si pasa ese tiempo fuerza la salida de la alerta y redirige
    });
});

$(document).ready(function () {

    const $btnLogout = $("#btnLogout"); /* Botón para cerrar sesión */
    const $dlgLogout = $("#dlgOverlay"); /* Alerta de confirmación para cerrar sesión, utiliza dlgOverlay que está estandarizado para ocupar en diversos casos */
    const $goLogout = $("#goLogout"); /* En la alerta de confirmación para cerrar sesión, es el botón para confirmar */
    const $cancelLogout = $("#cancelLogout"); /* En la alerta de confirmación, calcela el cierre de sesión */

    $btnLogout.on("click", function (e) { /* Detecta el click */
        e.preventDefault(); /* Previene comportamiento por default, en caso de haberlo */
        showAlert($dlgLogout); /* Despliega la alerta de confirmación */
    });

    $cancelLogout.on("click", function () { /* Detecta el click en el botón para cancelar el cierre de sesión */
        hideAlert($dlgLogout); /* Cierra la alerta de confirmación del cierre de sesión */
    });

    $goLogout.on("click", function () { /* Detecta el click en el botón que confirma el cierre de sesión */
        sessionStorage.removeItem("usuarioActivo"); /* Limpia el usuario activo (determinado al iniciar sesión) */
        localStorage.removeItem("usuarioGuardado"); /* Limpia el usuario guardado (retenido al marcar "recordarme") */
        window.location.href = $btnLogout.attr("href"); /* Redirige al inicio (index) */
    });
});

if ($saldo.length) { /* Al detectar el contenedor para el saldo */
    const usuario = getUsuarioActivo(); /* Carga el usuario */
    $saldo.val(usuario?.saldo || 0); /* Extrae su clave saldo y la despliega como el valor del input contenedor */
}

$btnSend.on("click", function (e) { /* Detecta click en el botón para confirmar un envio */
    e.preventDefault(); /* Previene comportamiento por default */

    const monto = Number($inputAmount.val()); /* Obtiene el monto ingresado como un numero */
    const $dlgCompleted = $("#dlgCompleted"); /* Alerta estandar */
    const $dlgSend = $("#dlgSend"); /* Alerta de confirmación de envio */
    const $dlgSendData = $("#dlgSendData"); /* Contenido de la alerta resumen (monto y contacto) */
    const usuario = getUsuarioActivo(); /* Obtiene el usuario */
    const saldoActual = usuario.saldo || 0; /* Extrae su saldo */

    const nuevoSaldo = saldoActual - monto - COBRO_SERVICIO; /* Resta al saldo, el monto enviado y el cobro servicio */

    usuario.saldo = nuevoSaldo; /* Actualiza el saldo del usuario */
    usuario.historial = usuario.historial || []; /* Asegura historial válido */

    let usuarioDestino = null; /* Declara el contacto destino del envio */

    if (selectedContact.banco.toLowerCase() === "alke" && selectedContact.cuenta) { /* Verifica que el contacto objetivo sea usuario Alke y tenga cuenta */
        usuarioDestino = buscarUsuarioPorCuenta(selectedContact.cuenta); /* Encuentra el usuario Alke registrado, cuya cuneta calce con la del contacto destino del envio */
    }

    usuario.historial.push({ /* Carga datos al historial del usuario activo del envio */
        cliente: selectedContact.alias,
        monto: -(monto + COBRO_SERVICIO),
        fecha: new Date().toLocaleDateString("es-CL"),
        tipo: "Transferencia",
        detalle: `- $${monto} <span class="text-muted small ms-2">-$${COBRO_SERVICIO} (tax)</span>`
    });

    guardarUsuario(usuario); /* Guarda los datos del usuario activo del array al JSON del localStorage */

    if (usuarioDestino) { /* Verifica que hay usuario destino y le carga datos */
        usuarioDestino.saldo = (usuarioDestino.saldo || 0) + monto;
        usuarioDestino.historial = usuarioDestino.historial || [];

        usuarioDestino.historial.push({
            cliente: usuario.alias,
            monto: monto,
            fecha: new Date().toLocaleDateString("es-CL"),
            tipo: "Depósito",
            detalle: `+ $${monto}`
        });

        guardarUsuario(usuarioDestino); /* Guarda los datos del usuario destino del array al JSON */
    }

    hideAlert($dlgSend); /* Esconde la alerta de confirmación */
    $inputAmount.val(""); /* Limpia el input del monto a enviar */

    $dlgSendData.text(`$${monto} enviados a ${selectedContact.alias}.`); /* Define el contenido de la alerta resumen de un envio completado */
    showAlert($dlgCompleted, 3000); /* Despliega la alerta durante 3 segundos */

    setTimeout(function () { /* Espera 3 segundos antes de redirigir al menú */
        window.location.href = "../pages/menu.html";
    }, 3000);
});

$cancelForm.on("click", function () { /* Limpia el formulario al cancelarlo */
    $("#nombre, #apellido, #cuenta, #banco, #alias").val("");
});

$closeForm.on("click", function () { /* Limpia el formulario al cerrarlo */
    $("#nombre, #apellido, #cuenta, #banco, #alias").val("");
});

$btnConfirm.on("click", function (e) { /* Detecta el click en el botón "Enviar" */
    e.preventDefault();

    const monto = Number($inputAmount.val()); /* Recibe el monto a enviar */
    const $dlgSend = $("#dlgSend"); /* Alerta de confirmación del envio */
    const $cancelSend = $("#cancelSend"); /* Botón para cancelar el envio en la confirmación */
    const $dlgData = $("#dlgData"); /* Contenido de la alerta estandar para el formulario de envio */
    const usuario = getUsuarioActivo(); /* Obtiene el usuario activo */
    const saldoActual = usuario.saldo || 0; /* Extrae saldo del usuario */


    if (!selectedContact) { /* Si no ha seleccionado un contacto despliega alerta */
        $("#dlgData").text("Seleccione un contacto");
        showAlert($dlgUser, 3000);
        return;
    }

    if (isNaN(monto) || monto < 1000 + COBRO_SERVICIO) { /* Si no está definido un monto o es menor a 1.500 despliega alerta */
        $dlgData.text("Ingrese un monto válido");
        showAlert($dlgUser, 3000);
        return;
    }

    if (saldoActual < monto + COBRO_SERVICIO) { /* Si el saldo es insuficiente despliega alerta */
        $dlgData.text("Saldo insuficiente");
        showAlert($dlgUser, 3000);
        return;
    }

    showAlert($dlgSend); /* Despliega alerta de confirmación */


    $cancelSend.on("click", function () { /* Detecta el click en el botón para cancelar el envio */
        hideAlert($dlgSend); /* Cierra la alerta de confirmación del envio */
    });
});

$(document).ready(function () {

    const $btnDelHistorial = $("#btnDelHistorial"); /* Botón para confirmar limpiar el historial */
    const $cancelDelHistorial = $("#cancelDelHistorial"); /* Botón para cancelar la limpieza de historial */


    $("#historyClean").on("click", function () { /* Detecta el click en el botón para limpiar el historial */
        showAlert($dlgHistorial); /* Despliega alerta de confirmación */
    });

    $cancelDelHistorial.on("click", function () { /* Detecta el click en el botón para cancelar la limpieza de historial */
        hideAlert($dlgHistorial); /* Cierra la alerta de confirmación */
    });

    $btnDelHistorial.on("click", function (e) { /* Detecta el click en el botón para confirmar la limpieza de historial */
        e.preventDefault();

        const usuario = getUsuarioActivo(); /* Obtiene el usuario */
        const saldoActual = usuario.saldo || 0; /* Extrae saldo del usuario */

        usuario.saldoBase = saldoActual; /* Carga el saldo actual a la clave saldoBase del usuario */
        localStorage.setItem("saldoBase", saldoActual); /* Lo guarda en el localStorage */

        usuario.historial = [];
        guardarUsuario(usuario); /* Actualiza los datos a nivel de usuario hasta el localstorage */

        if (typeof dibujarGraficoSaldo === 'function') dibujarGraficoSaldo(); /* Si procede aplica la funcion que dibuja el gráfico */
        cargarHistorial(); /* Recarga la visión del historial */
        hideAlert($dlgHistorial); /* Cierra la alerta de confirmación */


        setTimeout(function () { /* Espera 3 segundos antes de redirigir al menú */
            window.location.href = "../pages/menu.html";
        }, 3000);
    });
});