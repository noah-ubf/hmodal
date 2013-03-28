/**
 * Usage: 
 *     $(...).hmodal();
 *   or
 *     $(...).hmodal(config);
 * if config=='hide' then hide modal;
 * if config=={object} then show modal with parameters. Parameters can be:
 *     shadeNoClose - do not close when shade is clicked
 *     escNoClose - do not close when Esc key is pressed
 *     onClose - function to be called when the modal is closed. If it returns false then the modal refuses to hide.
 *
 * You can bind events too:
 *   dialog.bind('hmodal.show', function () { console.log ( 'Modal is starting to show' ); })
 *   dialog.bind('hmodal.shown', function () { console.log ( 'Modal has finished to show' ); })
 *   dialog.bind('hmodal.hide', function () { console.log ( 'Modal is starting to hide' ); })
 *   dialog.bind('hmodal.hidden', function () { console.log ( 'Modal has finished to hide' ); })
 */
(function ($) {

    var pageblocker,
        modalStack = [],
        zStep = 100,
        zStart = 10000
        delay = 600,
        shift = 10;

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
            m.trigger('hmodal.show', m);
            var screenH = pageblocker.outerHeight(true);
            m.css({
                top: -screenH + 'px', 
                'margin-top': (- Math.floor(m.outerHeight() / 2)) + 'px', 
                opacity: 0,
                left: '50%',
                'margin-left': (- Math.floor(m.outerWidth() / 2)) + 'px',
                'z-index': zStart + (zStep + 1) * modalStack.length, 
                position: 'fixed'
            });
            m.addClass('shown');
            m.animate({top: Math.floor(screenH/2) + 'px', opacity: 1}, delay, function () {
                m.attr('tabindex', 0).css('outline', 'none').css({top: '50%'}).focus();
                m.trigger('hmodal.shown', m);
            });
        }
    }

    function hideElement(m, removeOnClose) {
        if (m.is(':visible')) {
            m.trigger('hmodal.hide', m);
            m.animate({top: '-100%', opacity: 0}, delay, function () {
                m.removeClass('shown');
                m.trigger('hmodal.hidden', m);
                if (removeOnClose) {
                    m.remove();
                }
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

    function resizeAll () {
        for (var i in modalStack) {
            resizeModal(modalStack[i]);
        }
    }

    function resizeModal (m) {
        var i = findInStack (m.el),
            delta = i * shift;
        m.el.animate({
            'margin-top': (- Math.floor(m.el.outerHeight() / 2) + delta) + 'px',
            'margin-left': (- Math.floor(m.el.outerWidth() / 2) + delta) + 'px',
        }, 5);
    }

    function openModal (m, p) {
        var i = findInStack (m),
            params = p || {};
        pageblocker = $('.pageblocker');
        if (pageblocker.length == 0) {
            pageblocker = $('<div>').addClass('pageblocker').css({position: fixed, top: 0; left: 0; width: 100%; height: 100%;});
            pageblocker.click(function () { 
                var params = modalStack[modalStack.length - 1].params;
                if (params['shadeNoClose']) {
                    return;
                }
                closeModal();
            })
            $('body').append(pageblocker);
        }
        if (i<0) {
            if (m.closest('body').length==0) {
                $('body').append(m);
                params.removeOnClose = true;
            }
            m.addClass('hmodal');
            showElement(m);
            modalStack[modalStack.length] = {el: m, params: p || {}};
            rearrangeStack ();
            $('.btn-modal-close', m).click(function (e) {
                e.preventDefault();
                e.stopPropagation();
                closeModal();
            });
        }
    }

    function closeModal (m) {
        var i = m ? findInStack (m) : modalStack.length - 1;
        if (i >= 0) {
            var params = modalStack[i].params;
            if (typeof params.onClose == 'function') {
                if (params.onClose.call(m)===false) {
                    return false;
                }
            }
            hideElement(modalStack[i].el, modalStack[i].params.removeOnClose);
            modalStack.splice(i, 1);
            rearrangeStack ();
        }
        return false;
    }

    function filterInput(e) {
        if (modalStack.length > 0) {
            var m = modalStack[modalStack.length - 1];
            if (e.which == 9) {
                var el = $(':focus');
                if (el.closest('.hmodal').get(0) != m.el.get(0)) {
                    m.el.focus();
                }
            }
        }
    }

    function filterEsc(e) {
        if (modalStack.length > 0) {
            var m = modalStack[modalStack.length - 1];
            if (e.which == 27 && !m.params.escNoClose) {
                closeModal();
            }
        }
    }

    $(document).keydown(filterInput).keyup(filterInput).keypress(filterInput).keydown(filterEsc);

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