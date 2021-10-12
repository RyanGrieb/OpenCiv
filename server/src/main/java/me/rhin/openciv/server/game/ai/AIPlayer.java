package me.rhin.openciv.server.game.ai;

import java.util.List;

import me.rhin.openciv.server.game.AbstractPlayer;

public abstract class AIPlayer extends AbstractPlayer {

	public abstract List<AIProperties> getProperties();
}
