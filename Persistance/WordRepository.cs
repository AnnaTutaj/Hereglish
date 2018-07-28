using System.Threading.Tasks;
using Hereglish.Models;
using Microsoft.EntityFrameworkCore;

namespace Hereglish.Persistance
{
    public class WordRepository : IWordRepository
    {
        private readonly HereglishDbContext context;

        public WordRepository(HereglishDbContext context)
        {
            this.context = context;
        }

        public async Task<Word> GetWord(int id, bool includeRelated = true)
        {
            if (!includeRelated)
            {
                return await context.Words.FindAsync(id);
            }

            return await context.Words
                .Include(w => w.Features)
                    .ThenInclude(wf => wf.Feature)
                .Include(w => w.Subcategory)
                    .ThenInclude(m => m.Category)
                .SingleOrDefaultAsync(w => w.Id == id);
        }

        public void Add(Word word)
        {
            context.Words.Add(word);
        }

        public void Remove(Word word)
        {
            context.Words.Remove(word);
        }

    }
}