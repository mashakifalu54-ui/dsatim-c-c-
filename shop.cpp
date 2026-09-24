#include <iostream>
using namespace std;

int main()
{

    double price;
    int quantity ;
    double cost;

    cout << "Enter Item price ";cin price;
    cout << "Enter quantity   " ;cin quantity;

    cost= price * quantity;

    cout << "Price     " << price <<endl;

     cout << "Quantity  " << quantity <<endl;

    cout << "Total cost  " << cost <<endl; 


    return 0;
}
