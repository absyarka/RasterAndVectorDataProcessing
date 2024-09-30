import matplotlib.pyplot as plt

x = [i for i in range(1, 9)]
y = [5921, 4036, 3035,  2896, 2636, 2587, 2505, 2583]

plt.plot(x, y, color='red', marker='o', markersize=7)
plt.xlabel('Количество Worker-ов')
plt.ylabel('Время работы RZS (мс)')
plt.legend()
plt.savefig('plot.png', dpi=300, bbox_inches='tight')