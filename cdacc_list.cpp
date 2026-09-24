#include <iostream>
#include <string>
#include <list>
using namespace std;

int main()
{
list< string> days= {
"Tuesday",
"Wednesday",
"Friday" ,
"Sunday"

};
days.push_front("Monday");
cout<<"Ater adding Monday: "<<endl;
for (string day: days)
{
    cout<< day<<endl;

}

days.remove("Saturday");
cout<< "After removing Saturday:"<<endl;
for(string day: days)
{
    cout<< day<<endl;
}

cout << "First day: "<< days.front()<<endl;
cout<< "Last day: "<< days.back()<<endl;

days.reverse();

cout << "Reverse order: "<<endl;

for (string day : days)
{
    cout<<day<<endl;
}







return 0;

}