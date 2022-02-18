package me.rhin.openciv.ui.button.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.shared.logging.Logger;
import me.rhin.openciv.shared.logging.LoggerFactory;
import me.rhin.openciv.shared.logging.LoggerType;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.type.ChatboxWindow;

public class SendMessageButton extends Button {
	private static final Logger LOGGER = LoggerFactory.getInstance(LoggerType.LOG_TAG);

	private Sprite iconSprite;

	public SendMessageButton(float x, float y, float width, float height) {
		super(TextureEnum.UI_BUTTON_ICON, "", x, y, width, height);

		this.hoveredSprite = TextureEnum.UI_BUTTON_ICON_HOVERED.sprite();
		hoveredSprite.setBounds(x, y, width, height);

		this.iconSprite = TextureEnum.ICON_GOTO_RIGHT.sprite();
		iconSprite.setBounds(x + (width / 2) - (24 / 2), y + (height / 2) - (24 / 2), 24, 24);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);
		iconSprite.draw(batch);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		// iconSprite.setPosition(x + getWidth() / 2 - iconSprite.getWidth() / 2,
		// y + getHeight() / 2 - iconSprite.getHeight() / 2);
	}

	@Override
	public void onClick() {
		ChatboxWindow window = (ChatboxWindow) getParent();
		window.sendMessage();
		LOGGER.info("yo");
	}
}
