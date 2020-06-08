package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.button.Button;

public class GithubButton extends Button {

	public GithubButton(int x, int y, int width, int height) {
		super(TextureEnum.UI_GITHUB, "", x, y, width, height);
	}

	@Override
	public void onClick() {
		// FIXME: Make this cross compatible.
		// redirect("https://github.com/rhin123");
	}

	public static native void redirect(String url)/*-{
													$wnd.location.assign(url)	
													}-*/;
}
