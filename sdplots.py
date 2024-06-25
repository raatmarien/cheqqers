import numpy as np
import matplotlib.pyplot as plt

sizes = ['5x5', '6x6', '7x7', '8x8', '10x10', '12x12', '14x14']

times = False
draw = False
if(draw):
    ################################
    # DRAW
    # Data for CLASSICAL
    avg_times_classical = [0.008752567529678344, 0.0178715078830719, 0.023899346351623534, 0.04302080082893372, 0.0977346498966217, 0.16420314931869506, 0.1278181130886078]
    sd_times_classical = [0.002887601995528307, 0.007456409938703018, 0.009629619497579187, 0.015701466834036615, 0.030777788723386063, 0.05727558056347351, 0.08631333635757185]

    # Data for QUANTUM_V1
    avg_times_quantum_v1 = [0.05324737119674683, 0.10075943493843079, 0.16039631581306457, 0.22312244129180908, 0.4396460111141205, 0.33864057922363283, 0.13527703547477724]
    sd_times_quantum_v1 = [0.04196382354161201, 0.07658849547773056, 0.11021851832306824, 0.13175634980293413, 0.21065906629167297, 0.28419149313242753, 0.17019527198406134]

    # Data for QUANTUM_V2
    avg_times_quantum_v2 = [0.0766147301197052, 0.13317222833633424, 0.18969980144500734, 0.281934171915054, 0.40187505626678466, 0.30547124457359315, 0.13494586825370788]
    sd_times_quantum_v2 = [0.05877304961628044, 0.09119094211467112, 0.11362690333998866, 0.1486063344491579, 0.1962804560258262, 0.2609900228825713, 0.15237524469698255]

    # Data for CLASSICAL
    avg_moves_classical = [14.398, 24.335, 33.509, 48.9, 75.368, 91.059, 54.083]
    sd_moves_classical = [7.240581607994072, 13.099021313035541, 17.35601193103272, 22.18770592680312, 25.54221957819995, 31.75351641637198, 33.95545735348125]

    # Data for QUANTUM_V1
    avg_moves_quantum_v1 = [18.323, 29.562, 41.37, 57.665, 84.16, 64.824, 42.316]
    sd_moves_quantum_v1 = [10.753990855460094, 16.98159387485552, 21.464711361530902, 25.035765707574527, 28.032306544596185, 38.61147329317893, 15.271652411162565]

    # Data for QUANTUM_V2
    avg_moves_quantum_v2 = [20.62, 31.573, 42.501, 59.917, 78.491, 59.666, 41.831]
    sd_moves_quantum_v2 = [12.293523934606005, 16.499360590638048, 20.376388202922424, 23.79151418357283, 28.37073876052257, 35.131676286204716, 13.210562363425637]
else:
    ##############################
    # NO DRAW
    # Data for CLASSICAL
    avg_times_classical = [0.009685205221176147, 0.01971555995941162, 0.026823137521743774, 0.04866820669174194, 0.12563368034362793, 0.2886088836193085, 0.5789017131328583]
    sd_times_classical = [0.0029174651957255726, 0.00746918457167165, 0.012120777241028162, 0.022335891797192264, 0.06267250372758987, 0.14271462768676715, 0.29151789019090185]

    # Data for QUANTUM_V1
    avg_times_quantum_v1 =[0.046092604637146, 0.09616149616241455, 0.20791942906379698, 0.4307036771774292, 1.7982378718852996, 7.330296731472015, 42.64630459237099]
    sd_times_quantum_v1 = [0.038658659426371034, 0.08425050942884503, 0.19244878102999025, 0.40411082039681306, 1.6942054610933301, 7.0876348015739525, 86.60280570490978]

    # Data for QUANTUM_V2
    avg_times_quantum_v2 = [0.06552555561065673, 0.1304490065574646, 0.2553812355995178, 0.5238968427181244, 2.1505238111019134, 8.498090515851974, 46.66558102440834]
    sd_times_quantum_v2 = [0.05304639856104804, 0.10505861271569854, 0.22409775721877204, 0.48269936818398884, 1.8804307144049626, 7.748203000013139, 96.42121897414656]

    # Data for CLASSICAL
    avg_moves_classical = [14.625, 25.847, 35.714, 54.802, 113.349, 205.513, 319.062]
    sd_moves_classical = [7.399265107030841, 14.173442682618697, 21.639511835355076, 33.65476845024252, 
                        68.24383063266173, 113.95556020089893, 176.2971663040755]

    # Data for QUANTUM_V1
    avg_moves_quantum_v1 = [18.103, 30.767, 51.048, 85.524, 211.625, 494.397, 897.464]
    sd_moves_quantum_v1 = [11.285022939398162, 20.343858620811922, 37.33011161560106, 63.4361061507054, 
                        164.11761930995698, 347.75429320058646, 598.0055345256625]

    # Data for QUANTUM_V2
    avg_moves_quantum_v2 = [20.536, 35.371, 55.15, 92.115, 217.206, 476.571, 943.718]
    sd_moves_quantum_v2 = [12.737462343298485, 22.645489113224674, 39.58692492003672, 69.0079551419463, 
                        156.23779892783247, 337.448482642073, 613.9790311783674]

# X values (assuming they are 1 through 7)
x_values = sizes

# Plotting
plt.figure(figsize=(12, 8))

if(times):
    y1 = avg_times_classical
    y2 = avg_times_quantum_v1
    y3 = avg_times_quantum_v2
    sd1 = sd_times_classical
    sd2 = sd_times_quantum_v1
    sd3 = sd_times_quantum_v2
else:
    y1 = avg_moves_classical
    y2 = avg_moves_quantum_v1
    y3 = avg_moves_quantum_v2
    sd1 = sd_moves_classical
    sd2 = sd_moves_quantum_v1
    sd3 = sd_moves_quantum_v2

# CLASSICAL plot
plt.errorbar(x_values, y1, yerr=sd1, fmt='-o', capsize=5, 
             elinewidth=2, markeredgewidth=2, label='CLASSICAL', color='blue')

# QUANTUM_V1 plot
plt.errorbar(x_values, y2, yerr=sd2, fmt='-s', capsize=5, 
             elinewidth=2, markeredgewidth=2, label='QUANTUM_V1', color='green')

# QUANTUM_V2 plot
plt.errorbar(x_values, y3, yerr=sd3, fmt='-^', capsize=5, 
             elinewidth=2, markeredgewidth=2, label='QUANTUM_V2', color='orange')

if(times):
    plt.title('Average time per game for different board sizes')
    plt.ylabel('Average Time (s)')
else:
    plt.title('Average number of moves with for different board sizes')
    plt.ylabel('Average Moves')
plt.xlabel('Board Size')
plt.legend()
plt.grid(True)
plt.xticks(x_values)
if(times):
    if(draw):
        pltname = 'draw_average_times_sd.png'
    else:
        pltname = 'no_draw_average_times_sd.png'
else:
    if(draw):
        pltname = 'draw_average_moves_sd.png'
    else:
        pltname = 'no_draw_average_moves_sd.png'
plt.savefig(pltname)
plt.show()