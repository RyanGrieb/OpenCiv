package me.rhin.openciv.ui.button;

import me.rhin.openciv.asset.TextureEnum;

public class CustomButton extends AbstractButton {

	private Runnable runnable;

	public CustomButton(String text, float x, float y, float width, float height) {
		super(text, x, y, width, height);
	}

	public CustomButton(TextureEnum mainTexture, TextureEnum hoveredTexture, float x, float y, float width,
			float height) {
		super(mainTexture, hoveredTexture, x, y, width, height);
	}

	public CustomButton(TextureEnum mainTexture, TextureEnum hoveredTexture, TextureEnum iconTexture, float x, float y,
			float width, float height, float iconWidth, float iconHeight) {
		super(mainTexture, hoveredTexture, iconTexture, x, y, width, height, iconWidth, iconHeight);
	}

	public CustomButton(TextureEnum mainTexture, TextureEnum hoveredTexture, TextureEnum iconTexture, float x, float y,
			float width, float height) {
		super(mainTexture, hoveredTexture, iconTexture, x, y, width, height);
	}

	public CustomButton(TextureEnum mainTexture, TextureEnum hoveredTexture, String text, float x, float y, float width,
			float height) {
		super(mainTexture, hoveredTexture, text, x, y, width, height);
	}

	private CustomButton(float x, float y, float width, float height) {
		super(x, y, width, height);
	}

	@Override
	public void onClicked() {
		runnable.run();
	}

	/**
	 * Define what the button does when it's clicked. Set's the CustomButton's
	 * Runnable variable to be ran by onClicked().
	 * 
	 * @param runnable
	 */
	public void onClick(Runnable runnable) {
		this.runnable = runnable;
	}
}
