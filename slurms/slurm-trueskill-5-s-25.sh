#!/bin/bash -l
#SBATCH -o ./tjob.%A_%a.out
#SBATCH -e ./tjob.%A_%a.err
# Initial working directory:
#SBATCH -D ./
# Job Name:
#SBATCH -J ts5s25 # job dependent
# Queue (Partition):
#SBATCH --partition=cpu-short
# Number of nodes and MPI tasks per node:
#SBATCH --nodes=1
#SBATCH --ntasks-per-node=1
#SBATCH --cpus-per-task=8
#
#SBATCH --mail-type=FAIL
#SBATCH --mail-user=raat@mail.lorentz.leidenuniv.nl # useslurr dependent
#
# Wall clock limit
#SBATCH --time=3:59:00
#Load some modules
module load ALICE/default
cd /home/lijt/quantum-checkers
source /home/lijt/quantum-checkers/checkers_env/bin/activate
# adding paths for my modules
# Run the program:
time python run_trueskill.py s 5 25
