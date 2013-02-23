/**
* Usage: 
*     $(...).hmodal();
*   or
*     $(...).hmodal(config);
* if config=='hide' then hide modal;
* if config=={object} then show modal with parameters. Parameters can be:
*     shadeNoClose - do not close when shade is clicked
*     escNoClose - do not close when Esc key is pressed
*/
(function ($) {

    var pageblocker,
        modalStack = [],
        zStep = 100,
        zStart = 10000
        delay = 600;

    function findInStack (m) {
        if (!('get' in m)) return -1;
        for (var i = 0, el = m.get(0); i < modalStack.length; i++) {
            if (modalStack[i].el.get(0) == el) {
                return i;
            }
        }
        return -1;
    }

    function showElement(m) {
        if (!m.is(':visible')) {
            var screenH = pageblocker.outerHeight(true);
            m.css({
                top: -screenH + 'px', 
                'margin-top': (- Math.floor(m.outerHeight() / 2)) + 'px', 
                opacity: 0, 
                'z-index': zStart + (zStep + 1) * modalStack.length, 
                position: 'fixed'
            });
            m.addClass('shown');
            m.animate({top: Math.floor(screenH/2) + 'px', opacity: 1}, delay, function () {
                m.attr('tabindex', 0).css('outline', 'none').css({top: '50%'}).focus();
            });
        }
    }

    function hideElement(m) {
        if (m.is(':visible')) {
            m.animate({top: '-100%', opacity: 0}, delay, function () {
                m.removeClass('shown');
            });
        }
    }

    function rearrangeStack () {
        if (modalStack.length == 0) {
            pageblocker.fadeOut(delay);
            return;
        }
        var zMax = zStart + zStep * modalStack.length;
        pageblocker.css('z-index', zMax - 10);
        for (var i = modalStack.length - 1; i >= 0; i--) {
            modalStack[i].el.css('z-index', zMax);
            zMax -= zStep;
        }
        pageblocker.fadeIn(delay);
    }

    function openModal (m, p) {
        var i = findInStack (m);
        pageblocker = $('.pageblocker');
        if (pageblocker.length == 0) {
            pageblocker = $('<div>').addClass('pageblocker');
            pageblocker.click(function () { 
                params = modalStack[modalStack.length - 1].params;
                if (params['shadeNoClose']) {
                    return;
                }
                closeModal();
            })
            $('body').append(pageblocker);
        }
        if (i<0) {
            showElement(m);
            modalStack[modalStack.length] = {el: m, params: p || {}};
            rearrangeStack ();
            $('.btn-modal-close', m).click(function () {closeModal();});
        }
    }

    function closeModal (m) {
        var i = m ? findInStack (m) : modalStack.length - 1;
        if (i >= 0) {
            params = modalStack[i].params;
            hideElement(modalStack[i].el);
            modalStack.splice(i, 1);
            rearrangeStack ();
            if (typeof params.onClose == 'function') {
                params.onClose();
            }
        }
        return false;
    }

    function filterInput(e) {
        if (modalStack.length > 0) {
            var m = modalStack[modalStack.length - 1];
            if (e.which == 27 && !m.params.escNoClose) {
                closeModal();
            }
            else if (e.which == 9) {
                var el = $(':focus');
                if (el.closest('.modal').get(0) != m.el.get(0)) {
                    m.el.focus();
                }
            }
        }
    }

    $(document).keydown(filterInput).keyup(filterInput).keypress(filterInput);

    $.fn.hmodal = function (config) {
        if (config=='hide') {
            closeModal (this);
        }
        else {
            openModal(this, config);
        }
        return this;
    };

})(jQuery);