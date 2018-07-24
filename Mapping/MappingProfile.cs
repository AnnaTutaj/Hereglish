using System.Collections.Generic;
using System.Linq;
using AutoMapper;
using Hereglish.Controllers.Resources;
using Hereglish.Models;

namespace Hereglish.Mapping
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            //Domain to API Resource
            CreateMap<Category, CategoryResource>();
            CreateMap<Subcategory, SubcategoryResource>();
            CreateMap<Feature, FeatureResource>();
            CreateMap<PartOfSpeech, PartOfSpeechResource>();
            CreateMap<Word, WordResource>()
            .ForMember(wr => wr.Pronunciation, opt => opt.MapFrom(w => new PronunciationResource { Uk = w.PronunciationUK, Us = w.PronunciationUS }))
            .ForMember(wr => wr.Features, opt => opt.MapFrom(w => w.Features.Select(wf => wf.FeatureId)));

            //API Resource to Domain
            CreateMap<WordResource, Word>()
            .ForMember(w => w.Id, opt => opt.Ignore())
            .ForMember(w => w.PronunciationUK, opt => opt.MapFrom(wr => wr.Pronunciation.Uk))
            .ForMember(w => w.PronunciationUS, opt => opt.MapFrom(wr => wr.Pronunciation.Us))
            .ForMember(w => w.Features, opt => opt.Ignore())
            .AfterMap((wr, w) =>
            {
                // Remove features
                var removedFeatures = w.Features.Where(f => !wr.Features.Contains(f.FeatureId)).ToList();
                foreach (var f in removedFeatures)
                {
                    w.Features.Remove(f);
                }

                // Add features
                var addedFeatures = wr.Features
                .Where(id => !w.Features.Any(f => f.FeatureId == id))
                .Select(id => new WordFeature { FeatureId = id });
                foreach (var f in addedFeatures)
                {
                    w.Features.Add(f);
                }
            });
        }
    }
}