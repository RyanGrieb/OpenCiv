package me.rhin.openciv.ui.window.type;

import java.util.ArrayList;
import java.util.Collections;

import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.heritage.Heritage;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.button.type.CloseWindowButton;
import me.rhin.openciv.ui.game.HeritageLeaf;
import me.rhin.openciv.ui.game.HeritageLineWeb;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class HeritageWindow extends AbstractWindow {

	// TODO: Sort by level
	private ArrayList<HeritageLeaf> heritageLeafs;
	private BlankBackground blankBackground;
	private CustomLabel heritageDescLabel;
	private CloseWindowButton closeWindowButton;
	private HeritageLineWeb heritageLineWeb;

	public HeritageWindow() {
		super.setBounds(0, 0, viewport.getWorldWidth(), viewport.getWorldHeight());

		this.heritageLeafs = new ArrayList<>();

		this.blankBackground = new BlankBackground(0, 0, getWidth(), getHeight());
		addActor(blankBackground);

		this.heritageDescLabel = new CustomLabel(
				Civilization.getInstance().getGame().getPlayer().getCivilization().getName() + "'s Heritage",
				Align.center, 0, getHeight() - 25, getWidth(), 15);
		addActor(heritageDescLabel);

		Civilization.getInstance().getGame().getPlayer().unselectUnit();

		for (Heritage heritage : Civilization.getInstance().getGame().getPlayer().getHeritageTree().getAllHeritage()) {
			addHeritage(heritage);
		}

		this.closeWindowButton = new CloseWindowButton(this.getClass(), "Close", viewport.getWorldWidth() / 2 - 150 / 2,
				35, 150, 45);
		addActor(closeWindowButton);

		this.heritageLineWeb = new HeritageLineWeb(heritageLeafs);
		addActor(heritageLineWeb);
	}

	@EventHandler
	public void onResize(int width, int height) {
		super.setSize(width, height);
		blankBackground.setSize(width, height);
		heritageDescLabel.setBounds(0, height - 25, width, 15);
		closeWindowButton.setPosition(width / 2 - closeWindowButton.getWidth() / 2, closeWindowButton.getHeight());

		updateLeafPositions(width, height);
	}

	@EventHandler
	public void onPickHeritage(Heritage heritage) {
		for (HeritageLeaf leaf : heritageLeafs) {
			if (leaf.getHeritage().equals(heritage))
				leaf.setStudying(true);
			else
				leaf.setStudying(false);
		}
	}

	@Override
	public boolean disablesInput() {
		return true;
	}

	@Override
	public boolean disablesCameraMovement() {
		return true;
	}

	@Override
	public boolean closesOtherWindows() {
		return true;
	}

	@Override
	public boolean closesGameDisplayWindows() {
		return false;
	}

	@Override
	public boolean isGameDisplayWindow() {
		return false;
	}

	private void addHeritage(Heritage heritage) {

		float width = 210;
		float height = 45;

		float x = 25;

		float y = getHeight() - height - 50;

		HeritageLeaf heritageLeaf = new HeritageLeaf(heritage, x, y, width, height);
		heritageLeafs.add(heritageLeaf);
		Collections.sort(heritageLeafs);

		updateLeafPositions(viewport.getWorldWidth(), viewport.getWorldHeight());
	}

	private void updateLeafPositions(float worldWidth, float worldHeight) {
		float width = 210;
		float height = 45;

		float x = 25;

		float y = worldHeight - height - 50;

		for (HeritageLeaf leaf : heritageLeafs) {
			if (leaf.getStage() != null) {
				removeActor(leaf);
				// actor.addAction(Actions.removeActor());
			}
		}

		// Base position based off ourselfs and the previous leaf
		for (int i = 0; i < heritageLeafs.size(); i++) {
			HeritageLeaf leaf = heritageLeafs.get(i);
			HeritageLeaf prevLeaf = i < 1 ? null : heritageLeafs.get(i - 1);

			// If were on the same level as our prev leaf
			if (prevLeaf != null && prevLeaf.getHeritage().getLevel() == leaf.getHeritage().getLevel())
				x += 215;
			else if (prevLeaf != null && prevLeaf.getHeritage().getLevel() != leaf.getHeritage().getLevel()) {
				y -= 125;
				x = 25;
			}

			leaf.setPosition(x, y);
			addActor(leaf);
		}
	}
}
