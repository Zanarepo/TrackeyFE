import React from 'react';

export default function WhoIsSellyticsFor() {
  const audiences = [

    {
        title: 'Open Market Operations',
        description:
          'Designed for the fast-paced, flexible environments of market stalls, pop-up shops, and small business vendors where pricing is often negotiated and dynamic.',
        imageUrl: 'images/market.jpg',
      },



    {
      title: 'Corporate Operations',
      description:
        'Perfect for organized retail environments such as supermarkets, chain stores, and malls. Sellytics helps streamline inventory and sales in structured settings where pricing is static and staff are designated.',
      imageUrl: 'images/Office.jpg',
    },
   

    {
        title: 'Business Personnels',
        description:
          'Perfect for Emeka who has a shop at Alaba and also Computer village and wants to be able to monitor all these shops on the go using his mobile phone',
        imageUrl: 'images/Emeka.jpg',
      },




  ];





  return (
    <section className="bg-indigo-100 dark:bg-gray-900 py-12 px-6">
      <h2 className="md:text-4xl font-bold text-center text-indigo-900 dark:text-white mb-12">
        Who is Sellytics For?
      </h2>
      <div className="flex flex-col gap-16 max-w-6xl mx-auto">
        {audiences.map((item, idx) => (
          <div
            key={idx}
            className={`flex flex-col-reverse md:flex-row ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''} items-center gap-8`}
          >
            <div className="md:w-1/2 text-left">
              <h3 className="text-2xl font-semibold text-indigo-900 dark:text-white mb-4">
                {item.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                {item.description}
              </p>
            </div>
            <div className="md:w-1/2 w-full h-auto max-h-[500px]">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="object-cover w-full h-full rounded-xl shadow-lg"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
