package me.rhin.openciv.gwt;

import com.badlogic.gdx.ApplicationListener;
import com.badlogic.gdx.Game;
import com.badlogic.gdx.backends.gwt.GwtApplication;
import com.badlogic.gdx.backends.gwt.GwtApplicationConfiguration;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.ui.TextField;
import com.github.czyzby.websocket.GwtWebSockets;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.ui.screen.AbstractScreen;

/** Launches the GWT application. */
public class GwtLauncher extends GwtApplication {
	@Override
	public GwtApplicationConfiguration getConfig() {
		// Resizable application, uses available space in browser
		return new GwtApplicationConfiguration(true);
		// Fixed size application:

		// return new GwtApplicationConfiguration(800, 700);
	}

	@Override
	public void onModuleLoad() {
		super.onModuleLoad();

		setLoadingListener(new LoadingListener() {
			@Override
			public void beforeSetup() {
			}

			@Override
			public void afterSetup() {
				setupCopyListener();
			}
		});
	}

	@Override
	public ApplicationListener createApplicationListener() {
		GwtWebSockets.initiate();
		return new Civilization();
	}

	native void setupCopyListener() /*-{
    var self = this;
    var isSafari = navigator.appVersion.search('Safari') != -1 && navigator.appVersion.search('Chrome') == -1 && navigator.appVersion.search('CrMo') == -1 && navigator.appVersion.search('CriOS') == -1;
    var isIe = (navigator.userAgent.toLowerCase().indexOf("msie") != -1 || navigator.userAgent.toLowerCase().indexOf("trident") != -1);

    var ieClipboardDiv = $doc.getElementById('#ie-clipboard-contenteditable');
    var hiddenInput = $doc.getElementById("hidden-input");
    var getTextToCopy = $entry(function(){
        return self.@me.rhin.openciv.gwt.GwtLauncher::copy()();
    });
    var pasteText = $entry(function(text){
        self.@me.rhin.openciv.gwt.GwtLauncher::paste(Ljava/lang/String;)(text);
    });

    var focusHiddenArea = function() {
        // In order to ensure that the browser will fire clipboard events, we always need to have something selected
        hiddenInput.value = '';
        hiddenInput.focus();
        hiddenInput.select();
    };

    // Focuses an element to be ready for copy/paste (used exclusively for IE)
    var focusIeClipboardDiv = function() {
        ieClipboardDiv.focus();
        var range = document.createRange();
        range.selectNodeContents((ieClipboardDiv.get(0)));
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    };

    // For IE, we can get/set Text or URL just as we normally would,
    // but to get HTML, we need to let the browser perform the copy or paste
    // in a contenteditable div.
    var ieClipboardEvent = function(clipboardEvent) {
        var clipboardData = window.clipboardData;
        if (clipboardEvent == 'cut' || clipboardEvent == 'copy') {
            clipboardData.setData('Text', getTextToCopy());
            focusIeClipboardDiv();
            setTimeout(function() {
                focusHiddenArea();
                ieClipboardDiv.empty();
            }, 0);
        }
        if (clipboardEvent == 'paste') {
            var clipboardText = clipboardData.getData('Text');
            ieClipboardDiv.empty();
            setTimeout(function() {
                pasteText(clipboardText);
                ieClipboardDiv.empty();
                focusHiddenArea();
            }, 0);
        }
    };

    // For every broswer except IE, we can easily get and set data on the clipboard
    var standardClipboardEvent = function(clipboardEvent, event) {
        var clipboardData = event.clipboardData;
        if (clipboardEvent == 'cut' || clipboardEvent == 'copy') {
            clipboardData.setData('text/plain', getTextToCopy());
        }
        if (clipboardEvent == 'paste') {
            pasteText(clipboardData.getData('text/plain'));
        }
    };

    ['cut', 'copy', 'paste'].forEach(function (event) {
        $doc.addEventListener(event,function (e) {
            console.log(event);
            if(isIe) {
                ieClipboardEvent(event);
            } else {
                standardClipboardEvent(event, e);
                focusHiddenArea();
                e.preventDefault();
            }
        })
    })
}-*/;

	private void paste(String text) {
		consoleLog("in paste" + text);
		String oldText = getClipboard().getContents();
		if (!oldText.equals(text)) {
			getClipboard().setContents(text);
			Actor focusedActor = ((AbstractScreen) ((Game) getApplicationListener()).getScreen()).getStage()
					.getKeyboardFocus();
			if (focusedActor != null && focusedActor instanceof TextField) {
				if (!oldText.equals("")) {
					String textFieldText = ((TextField) focusedActor).getText();
					textFieldText = textFieldText.substring(0, textFieldText.lastIndexOf(oldText));
					((TextField) focusedActor).setText(textFieldText);
				}
				((TextField) focusedActor).appendText(text);
			}
		}
	}

	private String copy() {
		return getClipboard().getContents();
	}
}
