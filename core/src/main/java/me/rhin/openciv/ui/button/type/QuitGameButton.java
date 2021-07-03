package me.rhin.openciv.ui.button.type;

import com.badlogic.gdx.Gdx;

import me.rhin.openciv.ui.button.Button;

public class QuitGameButton extends Button {

	public QuitGameButton(float x, float y, float width, float height) {
		super("Quit Game", x, y, width, height);
	}

	@Override
	public void onClick() {
		Gdx.app.exit();
	}

}
