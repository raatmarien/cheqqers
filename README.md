# quantum_checkers
This repository is created for the master thesis by Luuk van den Nouweland, university of Leiden. This is the final version of the code. My thesis can be found in Master_Thesis.pdf.

There are three versions of Quantumness that can be ussed:
- Classical: Normal Checkers
- QUANTUM_V1: Checkers with only superpositions. This means that checkerpieces are able to exist in superpositions and are measured when they are capturing/being captured
- QUANTUM_V2: Checkers with entanglement and superpositions. This means that if a piece tries to capture a piece in superposition, they become entangled.

In the main file most parameters can be changed.
If you set white_mcts or black_mcts to true respectively the white or black player uses MCTS to decide its moves. args1 and args2 are respectively related to white or black. These can be set to args_high or args_low. The difference is that args_low builds smaller trees in MCTS and is therefore faster.

For more information, see Master_Thesis.pdf