package me.rhin.openciv.server.game.ai.behavior;

public class ErrorNode extends Node {

	public ErrorNode() {
		super("ErrorNode");
	}

	@Override
	public void tick() {
		System.out.println("Error node called");
	}

}
