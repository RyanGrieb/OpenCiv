package me.rhin.openciv.server.command;

public abstract class Command {
	private String name;

	public Command(String name) {
		this.name = name;
	}

	public abstract void call(String[] args);

	public String getName() {
		return name;
	}
}
