package me.rhin.openciv.ui.button.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.AbstractWindow;
import me.rhin.openciv.ui.window.type.ChatboxWindow;

public class CloseWindowButton extends Button {

	private Class<? extends AbstractWindow> windowClass;
	private Sprite iconSprite;

	public CloseWindowButton(Class<? extends AbstractWindow> windowClass, String name, float x, float y, float width,
			float height) {
		super(name, x, y, width, height);

		this.windowClass = windowClass;
	}

	public CloseWindowButton(Class<? extends ChatboxWindow> windowClass, TextureEnum textureEnum, float x, float y,
			int width, int height) {
		this(windowClass, "", x, y, width, height);

		this.iconSprite = textureEnum.sprite();
		iconSprite.setBounds(x + (width / 2) - (20 / 2), y + (height / 2) - (20 / 2), 20, 20);
	}

	@Override
	public void onClick() {
		Civilization.getInstance().getWindowManager().closeWindow(windowClass);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);
		if (iconSprite != null)
			iconSprite.draw(batch);
	}
}