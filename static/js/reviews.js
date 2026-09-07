// static/js/reviews.js
document.addEventListener('DOMContentLoaded', async () => {
    // 🟢 Sahi element ID dhoondo jo reviews.html me hai
    const grid = document.getElementById('allReviewsGrid');
    if (!grid) return;

    try {
        // 🟢 All reviews API endpoint
        const res = await fetch('/api/reviews/all');
        const data = await res.json();

        if (data.success && data.reviews && data.reviews.length > 0) {
            grid.innerHTML = data.reviews.map(rev => {
                const ratingCount = parseInt(rev.rating) || 5;

                let starHtml = '';
                for (let i = 1; i <= 5; i++) {
                    if (i <= ratingCount) {
                        starHtml += '<i class="fas fa-star text-amber-400 text-xs drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"></i> ';
                    } else {
                        starHtml += '<i class="far fa-star text-slate-600 text-xs"></i> ';
                    }
                }

                const userName = rev.user_name || 'Verified User';
                const commentText = rev.comment || '';
                const reviewDate = rev.date || 'Recent';
                const userPhoto = rev.user_photo && rev.user_photo.trim() !== '' 
                    ? rev.user_photo 
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4f46e5&color=fff&bold=true`;

                return `
                    <div class="relative group bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 hover:border-indigo-500/50 p-6 rounded-3xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 shadow-2xl hover:shadow-indigo-500/10 flex flex-col justify-between overflow-hidden">
                        
                        <div class="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500 pointer-events-none"></div>

                        <div>
                            <div class="flex items-center justify-between mb-4">
                                <div class="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1 rounded-full border border-slate-800">
                                    ${starHtml}
                                    <span class="text-xs font-bold text-amber-300 ml-1">${ratingCount}.0</span>
                                </div>
                                <i class="fas fa-quote-right text-slate-700/60 group-hover:text-indigo-500/40 text-xl transition-colors duration-300"></i>
                            </div>

                            <p class="text-slate-300 text-sm leading-relaxed mb-6 font-normal">
                                "${commentText}"
                            </p>
                        </div>

                        <div class="flex items-center justify-between border-t border-slate-800/70 pt-4 mt-auto">
                            <div class="flex items-center gap-3">
                                <div class="relative">
                                    <img src="${userPhoto}" alt="${userName}" class="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/40 shadow-md" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4f46e5&color=fff'">
                                    <span class="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
                                </div>
                                <div>
                                    <h4 class="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
                                        ${userName}
                                        <i class="fas fa-check-circle text-[11px] text-blue-400" title="Verified Candidate"></i>
                                    </h4>
                                    <span class="text-[11px] text-emerald-400 font-medium">Verified Job Seeker</span>
                                </div>
                            </div>

                            <span class="text-[11px] text-slate-500 font-medium">${reviewDate}</span>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            grid.innerHTML = `<p class="col-span-full text-center text-gray-400 py-12">No reviews found yet.</p>`;
        }
    } catch (e) {
        console.error("All reviews fetch error:", e);
        grid.innerHTML = `<p class="col-span-full text-center text-gray-500 py-12">Unable to load reviews right now.</p>`;
    }
});