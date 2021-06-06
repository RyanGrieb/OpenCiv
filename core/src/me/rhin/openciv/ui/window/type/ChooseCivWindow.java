package me.rhin.openciv.ui.window.type;

import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.window.AbstractWindow;

public class ChooseCivWindow extends AbstractWindow implements ResizeListener {

	public ChooseCivWindow() {

	}

	@Override
	public void onResize(int width, int height) {
		// TODO Auto-generated method stub

	}

	@Override
	public boolean disablesInput() {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public boolean disablesCameraMovement() {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public boolean closesOtherWindows() {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public boolean closesGameDisplayWindows() {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public boolean isGameDisplayWindow() {
		// TODO Auto-generated method stub
		return false;
	}

}
